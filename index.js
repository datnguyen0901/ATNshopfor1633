var express = require("express");
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
let alert = require('alert');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const { Pool, Client } = require("pg")
const path = require('path'); 
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'abc123',
    port: 5432,
})

var app = express();
xPORT = process.env.PORT || 3000;
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/account'));
app.use(express.static(__dirname + '/products'));
app.set("view engine", "ejs");
app.set('views', [path.join(__dirname, './views'),path.join(__dirname, './views/products'),path.join(__dirname, './views/account')]);
app.listen(xPORT);
console.log("\n WEB tại PORT: ", xPORT);


// --------- ERROR Handle
app.use(
    (err, req, res, next) => {
        console.log("\n ERR: ", Date.now());
        res.status(500).send("WEB Broken !");
}
);

//Router
app.get("/", function (req, res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT * FROM account', function(err, result) {
          done();
          if (err) {
              res.end();
            return console.error('query error', err)
          }
          //console.log('hello from', res.rows[0].name)
          res.render("index", {list:result});
        })
      })
});

app.get('/home', function(req, res) {
	if (request.session.loggedin) {
		res.send('Welcome back, ' + request.session.username + '!');
	} else {
		res.send('Please login to view this page!');
	}
	response.end();
});

app.get('/login', function(req,res) {
    res.render('login');
});

app.get('/registry', function(req,res) {
    res.render('registry');
});

//Product controller
app.get('/products', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT * FROM product', function(err, result) {
          done();
          if (err) {
              res.end();
            return console.error('query error', err)
          }
          res.render('product', {list:result});
        })
      })
});

//Account controller
app.get('/profile/:id', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var id = req.params.id;
        client.query('SELECT * FROM account WHERE id = $1',[id] , function(err, result) {
          done();
          if (err) {
              res.end();
            return console.error('query error', err)
          }
          res.render("profile", {list:result});
        })
      })
});

app.post('/register', urlencodedParser, function(req,res) {

    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var name = req.body.name;
        var age = req.body.age;
        var email = req.body.email;
        var password = req.body.password;
        var birthdays = req.body.birthdays;
        var gender = req.body.gender;
        client.query("INSERT INTO account (name,age,email,password,gender) VALUES ('"+name+"',"+age+",'"+email+"','"+password+"','"+gender+"')", function(err, result) {
          done();
          if (err) {
              res.end();
            return console.error('query error', err)
          }
          res.redirect("/login");
        })
    })
});

app.post('/auth', urlencodedParser, function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
		client.query('SELECT * FROM account WHERE email = $1 AND password = $2', [email, password], function(err, results) {
            if (results != null) {
                res.render("profile", {list:results});
                if (err) {
                    res.end();
                  return console.error('query error', err)
                }
			} else {
				alert('Incorrect Email and/or Password!');
                res.redirect('/login');
			}			
			res.end();
	    });
    });
});

//Cart controller CRUD
//R: View cart item
app.get('/cart', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var id_product = req.params.id;
        var quantity = req.params.quantity;
        var sub_total = req.params.sub_total;
        client.query('SELECT p.img, p.name, p.price, c.quantity, c.id, p.price * c.quantity AS total FROM cart c, product p WHERE c.product_id = p.id' , function(err, result) {
          done();
          if (err) {
              res.end();
            return console.error('query error', err)
          }
          console.log(result.rows);
          res.render("mycart", {list:result});
        })
    })
});

//C: Create cart item
app.get('/cart/:id', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var id = req.params.id;
        var quantity = 1;
        client.query("INSERT INTO cart (product_id,quantity) VALUES ('"+id+"',"+quantity+")", function(err, result) {
            done();
            if (err) {
                res.end();
            return console.error('query error', err)
        }
        res.redirect("/cart");
        })
      })
});

//u: Update/edit cart
app.get('/editcart/:id', urlencodedParser, function(req,res) {
    var id = req.params.id;
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT p.img, p.name, c.quantity, c.id FROM cart c, product p WHERE c.product_id = p.id AND c.id = $1", [id], function(err, result) {
            done();
            if (err) {
                res.end();
            return console.error('query error', err)
        }
        res.render("editcart", {list:result});
        })
      })
});

app.get('/updatecart/:id', urlencodedParser, function(req,res) {
    var id = req.params.id;
    var quantity = req.query.quantity;
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE cart SET quantity = $2 WHERE id = $1", [id,quantity], function(err, result) {
            done();
            if (err) {
                res.end();
            return console.error('query error', err)
        }
        res.redirect("/cart");
        })
      })
});

//D: Delete cart
app.get('/cartdel1/:id', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var id = req.params.id;
        client.query("DELETE FROM cart WHERE id = $1", [id], function(err, result) {
            done();
            if (err) {
                res.end();
            return console.error('query error', err)
        }
        res.redirect("/cart");
        })
      })
});

app.get('/cartdelall', function(req,res) {
    pool.connect(function(err, client, done)  {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var id = req.params.id;
        client.query("DELETE FROM cart", function(err, result) {
            done();
            if (err) {
                res.end();
            return console.error('query error', err)
        }
        res.redirect("/cart");
        })
      })
});










