var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  var productName = req.query.name;
  res.render(`_products/subindex_${productName}`, { title: 'Cart' });
});

module.exports = router;
