const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models');
const crypto = require('crypto');
const appKey = 'Gcsr4iWvidjlVW3h3yeU3Gvj';
const PasswordReset = db.PasswordReset;
const Users = db.Users;

const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "mailhog",
//   port: 1025,
//   auth: {
//     user: 'user',
//     pass: 'password',
//   }
// });
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 465,
  auth: {
    user: 'apikey',
    pass: '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',
  }
});

var signup_failed_reason = '';
var login_failed_reason = '';
var remind_failed_reason = '';

var signup_name = '';
var signup_mailaddress = '';
var login_mailaddress = '';

router.get('/', async function(req, res) {

  if (!req.session.user) {
    res.render('index',
    {
      title: 'Test site.' ,
      signup_failed_reason : signup_failed_reason,
      login_failed_reason : login_failed_reason,
      remind_failed_reason : remind_failed_reason,

      signup_name : signup_name,
      signup_mailaddress : signup_mailaddress,

      login_mailaddress : login_mailaddress,
    });
  } else {
    // 情報を取得します
    const dataset = await Users.findAll();

    var username = '';
    var userinfo = '';
    await Users.findByPk(req.session.user.id)
    .then(user => {
      console.log(user.name);
      userinfo = user;
      username = user.name;
    });
    res.render('user', { title: username + ' is logined.', userid : req.session.user.id, userinfo : userinfo, dataset });

  }
  signup_failed_reason = '';
  login_failed_reason = '';
  remind_failed_reason = '';
});

router.post('/login', async function(req, res) {

  login_mailaddress = req.body.mailaddress;

  const { count, rows } = await Users.findAndCountAll({
    raw: true,
    where: {
      mailaddress: req.body.mailaddress,
    },
    offset: 0,
    limit: 1
  });
  if(count == 0){
    login_failed_reason = 'アカウントがありません。';
    res.redirect('/');
  } else {
    var row = rows[0];
    if (bcrypt.compareSync(req.body.password, row.password) ) {
      req.session.user = {id: row.id};
    } else {
      login_failed_reason = 'パスワードが誤っています。';
    }
    res.redirect('/');
  }
});

router.all('/logout', async function(req, res) {
  req.session.destroy((err) => {
    if (err) {
      res.send(err)
      return
    }
  })
  res.redirect('/');
});

router.post('/signup', async function(req, res) {
  let hashed_password = bcrypt.hashSync(req.body.password, 10);

  signup_mailaddress = req.body.mailaddress;
  signup_name = req.body.name;

  await Users.findOrCreate ({
    where : {mailaddress: req.body.mailaddress},
    defaults : {
      name: req.body.name,
      mailaddress: req.body.mailaddress,
      password : hashed_password,
      active: false
    }
  }). then(([user]) => {
    if(user.id && user.active) {
      signup_failed_reason = '既に同じメールアドレスのアカウントがあります。';
      res.redirect('/');
    } else {
      // 本登録URLを作成
      const hash = crypto.createHash('sha1')
        .update(user.mailaddress)
        .digest('hex');
      console.log('L131 hash = '+ hash);
      const now = new Date();
      const expiration = now.setHours(now.getHours() + 1); // 1時間だけ有効
      let verificationUrl = req.get('origin') +'/verify/'+ user.id +'/'+ hash +'?expires='+ expiration;
      const signature = crypto.createHmac('sha256', appKey)
        .update(verificationUrl)
        .digest('hex');
      verificationUrl += '&signature='+ signature;

      // 本登録メールを送信
      transporter.sendMail({
        from: 'maya.web.adm@gmail.com',
        to:  req.body.mailaddress,
        text: user.mailaddress+"様\n\n以下のURLをクリックして本登録を完了させてください。\n\n"+ verificationUrl,
        subject: '本登録メール',
      });

      if(user.id){
        signup_failed_reason = '仮登録メールを再送しました。';
      } else {
        signup_failed_reason = '仮登録メールを発信しました。';
      }

      res.redirect('/');
    }
  })
});

router.get('/verify/:id/:hash', (req, res) => {

  const userId = req.params.id;
  Users.findByPk(userId)
    .then(user => {
      console.log('L164 '+ user.mailaddress);

      if(!user) {
        res.status(422).send('このURLは正しくありません。');

      } else if(user.active) {  // すでに本登録が完了している場合
        // ログイン＆リダイレクト（Passport.js）
        req.session.user = {id: user.id};
        res.redirect('/');

      } else {
        const now = new Date();
        const hash = crypto.createHash('sha1')
          .update(user.mailaddress)
          .digest('hex');
        console.log('L179 hash = '+ hash);
        const isCorrectHash = (hash === req.params.hash);
        const isExpired = (now.getTime() > parseInt(req.query.expires));
        const verificationUrl = 'https://rocky-wildwood-40562.herokuapp.com/' + req.originalUrl.split('&signature=')[0];
        const signature = crypto.createHmac('sha256', appKey)
          .update(verificationUrl)
          .digest('hex');
        const isCorrectSignature = (signature === req.query.signature);

        console.log('L187 isCorrectHash =' + isCorrectHash + ' isCorrectSignature = '+isCorrectSignature + ' isExpired = '+isExpired);
        if(!isCorrectHash || !isCorrectSignature || isExpired) {

          res.status(422).send('このURLはすでに有効期限切れか、正しくありません。');

        } else {  // 本登録

          user.active = 1;
          user.save();

          req.session.user = {id: user.id};
          res.redirect('/');
        }
      }
    });
});

router.post('/setdata', async function(req, res) {
  await Users.findByPk(req.session.user.id)
  .then(user => {
    if(user){
      if(req.body.remove != 1){
        user.wheretogo = req.body.wheretogo;
        user.go_date = req.body.go_date;
        user.go_time = req.body.go_time;
        user.back_date = req.body.back_date;
        user.back_time = req.body.back_time;
      } else {
        user.wheretogo = '';
      }
      user.save();
      res.redirect('/');
    }
  });
});

router.post('/update_profile', async function(req, res) {
  let hashed_password = bcrypt.hashSync(req.body.password, 10);

  await Users.findByPk(req.session.user.id)
  .then(user => {
    if(user){
      user.password = hashed_password;
      user.save();
      res.redirect('/');
    }
  });
});

router.post('/update_password', async function(req, res) {
  await Users.findByPk(req.session.user.id)
  .then(user => {
    if(user){
      user.mailaddress = req.body.mailaddress;
      user.name = req.body.name;
      user.save();
      res.redirect('/');
    }
  });
});

router.post('/remind', async function(req, res) {
  const { count, rows } = await Users.findAndCountAll({
    raw: true,
    where: {
      mailaddress: req.body.mailaddress,
    },
    offset: 0,
    limit: 1
  });
  if(count == 0){
    remind_failed_reason = 'アカウントがありません。';
    res.redirect('/');
  } else {
    const email = req.body.mailaddress;
    const randomStr = Math.random().toFixed(36).substring(2, 38);
    const token = crypto.createHmac('sha256', appKey)
      .update(randomStr)
      .digest('hex');
    const passwordResetUrl = req.get('origin')  +'/password/reset/'+ token +'?email='+ encodeURIComponent(email);

    PasswordReset.findOrCreate({
      where: {
        mailaddress: email
      },
      defaults: {
        mailaddress: email,
        token: token,
        createdAt: new Date()
      }
    }).then(([passwordReset, created]) => {

      remind_failed_reason += ' L285';

      if(!created) {
        passwordReset.token = token;
        passwordReset.createdAt = new Date();
        passwordReset.save();
      }

      // メール送信
      transporter.sendMail({
        from: 'from@example.com',
        to: email,
        text: "以下のURLをクリックしてパスワードを再発行してください。\n\n"+ passwordResetUrl,
        subject: 'パスワード再発行メール',
      });

      res.json({ result: true });
      remind_failed_reason = 'パスワード再発行メールを発信しました。';
    });
    res.redirect('/');
  }
});

router.get('/password/reset/:token', (req, res) => {
  res.render('reset_email', {
    token: req.params.token,
  });
});

router.post('/password/reset/', (req, res) => {
  let hashed_password = bcrypt.hashSync(req.body.password, 10);
  let reset_fail_message = '';

  const mailaddress = req.body.mailaddress;
  const password = req.body.password;
  const token = req.body.token;

  PasswordReset.findOne({
    where: {
      mailaddress: mailaddress
    },
  }).then(passwordReset => {

    if(passwordReset &&
      passwordReset.token === token) {

      Users.findOne({
        where: {
          mailaddress: mailaddress
        },
      }).then(Users => {
        Users.password = hashed_password;
        Users.save();
        passwordReset.destroy();
      })
      res.redirect('/');
    } else {
      remind_failed_reason = 'このパスワードリセットトークンは無効です。'
      res.redirect('/');
    }
  });
});


module.exports = router;
