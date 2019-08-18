const debug = require('debug')('dev::');
const Retail = require('../models/Retail')
const bigml = require('bigml')

exports.filter_main = (req, res) => {
    // render the files that uploaded to mongo
    res.render('filter');
};

exports.search_result = (req, res) => {
    // get from mongo, and from the file all the records
    // res.send(req.body.fromDate);
    const result = req.body.fromDate + req.body.toDate
    const fromQuery = req.body.fromDate + 'T' + req.body.fromTime + ':00.000Z'
    const toQuery = req.body.toDate + 'T' + req.body.toTime + ':00.000Z'
    // res.send(result);

    //select retails from mongoDB by date
    // debug : select uniqe date:: 2010-12-01T06:34:00.000+00:00
    // Retail.find( { date: { $eq: new Date('2010-12-01T06:34:00.000Z') } } )

    //TODO:: repair bug {"retail_id":"536627"} should be only one record, at this time there is two records. -- FIXED: problem was because double upload of the file to the mongodb
    debug(fromQuery + ' --__--> ' + toQuery);
    // Retail.find({date : {$gte: new Date(fromQuery), $lte: new Date(toQuery) } }, (err, docs)=>{
    //     if (err) {return next(err); }

    //     // Render the result of bigML query
    //     console.log(docs);
        
    //     res.send('data found');
    // })

    connection = new bigml.BigML('cyberpunks5512', 'b3d538219d7b18fd87eb04db7d46386aeb344e28');
    
    var source = new bigml.Source();
    source.create('./public/ml/iris.csv', function(error, sourceInfo) {
      if (!error && sourceInfo) {
        var dataset = new bigml.Dataset();
        dataset.create(sourceInfo, function(error, datasetInfo) {
          if (!error && datasetInfo) {
            var model = new bigml.Model();
            model.create(datasetInfo, function (error, modelInfo) {
              if (!error && modelInfo) {
                var prediction = new bigml.Prediction();
                prediction.create(modelInfo, {'petal length': 1})
              }
            });
          }
        });
      }
    });
   


    
}