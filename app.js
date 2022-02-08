const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Samayoi1020',
  database: 'anns'
});
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
)
app.use((req,res,next)=>{
  if(req.session.user_id===undefined){
    res.locals.user_name = "ゲスト";
    res.locals.isLoggedIn = false;
  }else{
    res.locals.user_name = req.session.user_name;
    res.locals.isLoggedIn = true;
  }
  next();
})
connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});
/*-----------------ここから欲しいもの記録機能の処理---------*/
app.get('/',(req,res) =>{
  res.render('top.ejs');
});
app.get('/index',(req,res)=>{
  connection.query(
    'SELECT * FROM care_list',
    (error, results) => {
  res.render('index.ejs',{lists: results})
    }
  );
});
app.get('/new',(req,res) =>{
  res.render('new.ejs');
});
app.post('/create',(req,res)=>{
  connection.query(
    'INSERT INTO care_list(product) VALUES(?)',
    [req.body.listName],
    (error,results)=>{
      res.redirect('/index');
    }
  );
});  
app.post('/delete/:id',(req,res)=>{
  connection.query(
    "DELETE FROM care_list WHERE id=?",
    [req.params.id],
    (error,results)=>{
      res.redirect('/index');
    }
  );
});
app.get('/edit/:id',(req,res)=>{
  connection.query(
    'SELECT * FROM care_list WHERE id=?',
    [req.params.id],
    (error,results)=>{
      res.render('edit.ejs',{item: results[0]});
    }
  );
});
app.post('/update/:id',(req,res)=>{
  connection.query(
    'UPDATE care_list SET product = ? WHERE id = ?',
    [req.body.itemName,req.params.id],
    (error,results)=>{
      res.redirect('/index');
    });
});
/*------------------欲しいものリスト機能ここまで----------------- */
/*------------------ログイン処理機能------------------------------*/
app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM articles',
    (error, results) => {
      res.render('list.ejs', { articles: results });
    }
  );
});
app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM articles WHERE id = ?',
    [id],
    (error, results) => {
      res.render('article.ejs', { article: results[0] });
    }
  );
});
app.get('/signup',(req,res)=>{
  res.render('signup.ejs',{errors:[]});
});
app.post('/signup',(req, res, next) => {
  const user_name = req.body.user_name;
  const email = req.body.email;
  const password = req.body.password;
  const errors = [];
  if(user_name === ''){
    errors.push('ユーザー名が空です');
  }
  if(email === ''){
    errors.push('メールアドレスが空です');
  }
  if(password === ''){
    errors.push('パスワードが空です');
  }
  if(errors.length > 0){
    res.render('signup.ejs',{errors:errors})
  }else{
    next();
  }
},
(req,res,next)=>{
  const email = req.body.email;
  const errors = [];
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error,results)=>{
      if(results.length > 0){
        errors.push('ユーザー登録に失敗しました');
        res.render('signup.ejs',{errors:errors});
      }else{
        next();
      }
    }
  );
},
(req,res)=>{
  const user_name = req.body.user_name;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password,10,(error,hash)=>{
    connection.query(
      'INSERT INTO users(name,email,password) VALUES(?,?,?)',
      [user_name,email,hash],
      (error,results)=>{
        req.session.user_id = results.insertId;
        req.session.user_name = user_name;
        res.redirect('/list');
      }
    );
  });
});
app.get('/login',(req,res)=>{
  res.render('login.ejs');
});
app.post('/login',(req,res)=>{
  email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error,results)=>{
      if(results.length > 0){
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain,hash,(error,isEqual)=>{
          if(isEqual){
            req.session.user_id = results[0].id;
            req.session.user_name = results[0].name;
            res.redirect("/list");
          }else{
            res.redirect("/login");
          }
        });
      }else{
        res.redirect("/login");
      }
    }
  );
});
app.get('/logout',(req,res)=>{
  req.session.destroy((error)=>{
    res.redirect('/list');
  });
});
app.listen(3000);
