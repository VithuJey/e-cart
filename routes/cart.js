var express = require('express');
var router = express.Router();

var io;



/*
io.on('connection', function(socket) {
	console.log("a user connected");
});
*/


//this object will hold all the orders sent by people
let orders = new Object();
let orderCount = 0;

function stringifyNumber(number){
	count = String(number);
	if (count.length < 2)
		return '00' + count;
	else if (count.length < 3)
		return '0' + count;
	else
		return count;
	
}

router.setIo = function(_io) {
	io = _io;
	ioConnect();
}
ioConnect = () => {
	io.on('connection', function(socket) {
		
	});
}



router.get("/cart", function(req, res){
	res.send(req.session.cart);
});
router.get("/orders", function(req, res) {
	res.send(orders);
});

router.get('/place-order', function(req, res) {
	if (req.session.cart && req.session.cart.length != 0) {
		if (req.query.name && req.query.name.length >= 3 && req.query.table && req.query.table != "") {
			orderId = stringifyNumber(orderCount) + req.query.name.substr(0, 3) + req.query.table;
			orders[orderId] = new Object();
			orders[orderId].id = orderId;
			orders[orderId].table = req.query.table;
			orders[orderId].name = req.query.name;
			orders[orderId].paymentType = req.query.payment_type;
			orders[orderId].body = new Array();
			for(i = 0; i < req.session.cart.length; i++) {
				orders[orderId].body.push(req.session.cart[i]);
			}
			req.session.cart.splice(0, req.session.cart.length);
			orderCount++;
			res.render("order-success", {
				"title" : "Order Done",
				"order" : orders[orderId]
			});
			io.sockets.emit("new-order", orders[orderId]);
		}
		else {
			return res.render("order-error", {
				"title" : "Invalid Details",
				"message" : "Please enter your name and table number"
			});
		}
	}
	else {
		return res.render("order-error", {
				"title" : "Empty Cart",
				"message" : "Your cart is empty. Order can not be placed until you have something in cart"
			});
	}
});
router.get("/view", function(req, res) {
	if (req.query.orderId && orders[req.query.orderId])
		res.render("order-success", {
			"title" : "Order Done",
			"order" : orders[req.query.orderId]
		});
	else
		res.send("Invalid Order Id");
});
router.get("/cancel", function(req, res){
	if (req.query.orderId && orders[req.query.orderId] && req.session.user && req.session.user.status == "kitchen_admin") {
		orders[req.query.orderId].status=2;
		res.redirect("/cart/kitchen");
	}
	else {
		res.send("You are not the admin or invalid order id");
	}
});
router.get("/complete", function(req, res){
	if (req.query.orderId && orders[req.query.orderId] && req.session.user &&req.session.user.status == "kitchen_admin") {
		orders[req.query.orderId].status=1;
		res.redirect("/cart/kitchen");
	}
	else {
		res.send("You are not the admin or invalid order id");
	}
});
router.get('/', function(req, res, next) {
  var productName = req.query.name;
  var productPrice1 = req.query.price1 || 0;
  var productPrice2 = req.query.price2 || 0;
  var productImage = req.query.image;

    if (typeof req.session.cart === "undefined") {
        req.session.cart = [];
        req.session.cart.push({
            productName: productName,
            productPrice1:productPrice1,
            productPrice2:productPrice2,
            productImage:productImage,
            productQuantity: 1,
        });
    } else {
        var cart = req.session.cart;
        var newItem = true;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].productName == productName) {
                cart[i].productQuantity++;
                newItem = false;
                break;
            }
        }
        if (newItem) {
            cart.push({
                productName: productName,
                productPrice1:productPrice1,
                productPrice2:productPrice2,
                productImage:productImage,
                productQuantity: 1,
            });
        }
    }
    res.redirect('back');
});

router.get('/show', function(req, res, next) {
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        return res.render('cart', {
            title: 'cart',
            cart: null
        });
    } else {
        return res.render('cart', {
            title: 'cart',
            cart: req.session.cart
        });
    }
});

router.get('/increase-quantity', function(req, res, next) {
    var productName = req.query.product;
    var cart = req.session.cart;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].productName == productName) {
                cart[i].productQuantity++;
            }
        }
    res.redirect('/cart/show');
});

router.get('/decrease-quantity', function(req, res, next) {
    var productName = req.query.product;
    var cart = req.session.cart;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].productName == productName) {
            cart[i].productQuantity--;
        }
        if (cart[i].productQuantity < 1)
            cart.splice(i, 1)
    }
    res.redirect('/cart/show');
});

router.get('/delete', function(req, res, next) {
    var productName = req.query.product;
    var cart = req.session.cart;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].productName == productName) {
            cart.splice(i, 1);
            if (cart.length == 0) {
                delete req.session.cart;
            }
        }
    }
    res.redirect('/cart/show');
});

router.get("/kitchen", function (req, res){
	if (req.session.user && req.session.user.status == "kitchen_admin")
		return res.render("kitchen", {
			"title" : "Kitchen",
			"orders" : orders
		});
	else
		res.render("kitchen_login");
});
router.post("/kitchen/login", function(req, res) {
	if (req.body.uname == process.env.uname && req.body.pass == process.env.pass) {
		console.log("This is ok");
		req.session.user = {};
		req.session.user.status = "kitchen_admin";
		res.redirect("/cart/kitchen");
	}
	else {
		res.render("kitchen_login");
	}
});

module.exports = router;
