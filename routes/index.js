var express = require('express');
var cassandra = require('cassandra-driver')
var elasticsearch = require("elasticsearch")
var _ = require('lodash')
var client = new cassandra.Client({ contactPoints: ['localhost'], keyspace: 'cuedatademo' })

var router = express.Router();
var elclient = new elasticsearch.Client({
  host: 'localhost:9200'
})
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/search', function (req, res, next) {

  var elQuery = {"bool" : { "must": []}};
  if (req.query.q) {
    elQuery["bool"]["must"].push({ "match": { "name": req.query.q } })
  }
  else if (req.query.location) {
    elQuery["bool"]["must"].push({ "nested": { "path": "address", "query": { "bool": { "should": [
        { "match": { "address.city": req.query.location } },
        { "match": { "address.state": req.query.location } },
        { "match": { "address.country": req.query.location } }
      ],
      "minimum_should_match": 1
    }}}})
  }
  else if (req.query.sector) {
    elQuery["bool"]["must"].push({ "match": { "sector": req.query.sector } })
  }
  console.log(elQuery)
  elclient.search({
    index: 'cuedatademo',
    type: 'company',
    body: {
      query: elQuery
    }
  }).then((resp) => {
    var hits = resp.hits.hits;
    console.log(hits);
    res.render('searchresults', { title: "Search results", query: req.query.q, result: hits, location: req.query.location, sector: req.query.sector })
  }, (error) => {
    console.log(error)
    res.render('searchresults', { title: "Search results", query: req.query.q, error: "No results found." })
  })

})

router.get('/company/:name/profile', function (req, res, next) {

  var params = [];
  params.push(req.params.name);
  var query = 'SELECT * FROM company WHERE name = ? LIMIT 1';
  client.execute(query, params, { prepare: true })
    .then(result => {
      var leads = _.groupBy(result.rows[0].company_leads, (lead)=> lead.type)
      res.render('companydetails', { title: "Company Profile", company: result.rows[0], leads })
    })
    .catch((error)=>{
      console.log(error)
    })
  //  res.render('companydetails', { title: "Company Profile"})
})

router.get('/person/:id/profile', function (req, res, next) {

  var params = [];
  params.push(req.params.id);
  var query = 'SELECT * FROM person WHERE id = ? LIMIT 1';
  client.execute(query, params, { prepare: true })
    .then(result => {
      var leads = _.groupBy(result.rows[0].leads, (lead)=> lead.type)
      res.render('persondetails', { title: "Person Profile", person: result.rows[0], leads })
    })
    .catch((error)=>{
      console.log(error)
    })
    //res.render('persondetails', { title: "Company Profile"})
})


module.exports = router;
