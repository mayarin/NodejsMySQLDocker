const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models');
const crypto = require('crypto');
const appKey = 'Gcsr4iWvidjlVW3h3yeU3Gvj';

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mailhog",
  port: 1025,
  auth: {
    user: 'user',
    pass: 'password',
  }
});


var signup_failed_reason = '';
var login_failed_reason = '';

var signup_name = '';
var signup_mailaddress = '';
var login_mailaddress = '';

router.get('/', async function(req, res) {
  console.log('L10 ', signup_failed_reason);
  // console.log('L10 ', mailhog);

  // const mailer = require('nodemailer');

  // const smtp = mailer.createTransport({
  //   host: '127.0.0.1',
  //   port: '1025',
  //   auth: {
  //     user: 'user',
  //     pass: 'password',
  //   }
  // });

  // const mailOptions = {
  //   from: 'hoge@github.com',
  //   to: 'hogehoge@github.com',
  //   subject: 'タイトルです',
  //   html: 'メール本文です',
  // };

  if (!req.session.user) {
    res.render('index',
    {
      title: 'Test site.' ,
      signup_failed_reason : signup_failed_reason,
      login_failed_reason : login_failed_reason,

      signup_name : signup_name,
      signup_mailaddress : signup_mailaddress,

      login_mailaddress : login_mailaddress,
    });
  } else {
    res.render('user', { title: 'Logined.' });
  }
  signup_failed_reason = '';
  login_failed_reason = '';

});

router.post('/login', async function(req, res) {

  login_mailaddress = req.body.mailaddress;

  const { count, rows } = await db.Users.findAndCountAll({
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

  await db.Users.findOrCreate ({
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
      const now = new Date();
      const expiration = now.setHours(now.getHours() + 1); // 1時間だけ有効
      let verificationUrl = req.get('origin') +'/verify/'+ user.id +'/'+ hash +'?expires='+ expiration;
      const signature = crypto.createHmac('sha256', appKey)
        .update(verificationUrl)
        .digest('hex');
      verificationUrl += '&signature='+ signature;

      // 本登録メールを送信
      transporter.sendMail({
        from: 'from@example.com',
        to: 'to@example.com',
        text: "以下のURLをクリックして本登録を完了させてください。\n\n"+ verificationUrl,
        subject: '本登録メール',
      });

      if(user.id){
        signup_failed_reason = '仮登録メールを再送しました。';
      } else {
        signup_failed_reason = '仮登録メールを発信しました。';
      }
      res.redirect('/');
      }
    }
  )
});


router.get('/verify/:id/:hash', (req, res) => {

  const userId = req.params.id;
  db.Users.findByPk(userId)
    .then(user => {

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
        const isCorrectHash = (hash === req.params.hash);
        const isExpired = (now.getTime() > parseInt(req.query.expires));
        const verificationUrl = 'http://127.0.0.1:3000' + req.originalUrl.split('&signature=')[0];
        const signature = crypto.createHmac('sha256', appKey)
          .update(verificationUrl)
          .digest('hex');
        const isCorrectSignature = (signature === req.query.signature);

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

router.post('/create', async function(req, res) {
  const newTask = db.Task.build({
    task: req.body.task,
    done: false
  });
  await newTask.save();
  res.redirect('/');
});

router.post('/update', async function(req, res) {
  const task = await db.Task.findByPk(req.body.id);
  if (task) {
    task.done = !!(req.body.done);
    await task.save();
  }
  res.redirect('/');
});

router.post('/delete', async function(req, res) {
  const task = await db.Task.findByPk(req.body.id);
  if (task) {
    await task.destroy();
  }
  res.redirect('/');
});

module.exports = router;
