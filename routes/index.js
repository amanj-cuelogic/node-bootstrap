var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/search', function(req,res,next){
  res.render('searchresults', {title: "Search results", query: req.query.q})
})

router.get('/company/:id/profile', function(req,res,next){
  res.render('companydetails', {title: "Search results", query: req.query.q})
})


module.exports = router;
