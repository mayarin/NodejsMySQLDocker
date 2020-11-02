const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models');

var signup_failed_reason = '';
var login_failed_reason = '';

var signup_name = '';
var signup_mailaddress = '';
var login_mailaddress = '';

router.get('/', async function(req, res) {
  console.log('L10 ', signup_failed_reason);

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

  const { count, rows } = await db.Users.findAndCountAll({
    where: {
      mailaddress: req.body.mailaddress
    },
    offset: 0,
    limit: 1
  });
  if(count == 0){
    const newUser = await db.Users.create({
      name: req.body.name,
      mailaddress: req.body.mailaddress,
      password : hashed_password,
      active: true
    });
    if (newUser){
      req.session.user = {id: newUser.id};
      signup_failed_reason = '';
    } else {
      signup_failed_reason = 'アカウント登録に失敗しました。';
    }
    res.redirect('/');
  } else {
    signup_failed_reason = '既に同じメールアドレスのアカウントがあります。';
    res.redirect('/');
  }
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
