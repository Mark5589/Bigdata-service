const debug = require('debug')('dev::');
const Retail = require('../models/Retail');
const fs = require('fs');
var exec = require('child_process').exec;
var url = require('url');
const request = require('request');
const csv = require('csv-parser');

const path = require('path');
const http = require('http');
const { Parser } = require('json2csv');
const bigml = require('bigml');
const async = require('async');
let URLDownload = [];
let resBatchFile = {
  cluster0:[],
  cluster1:[],
  cluster2:[],
  cluster3:[]
};
let dateItems={};
let sortedDateItems = [];

const util = require('util')

const streamPipeline = util.promisify(require('stream').pipeline)

const fetch = require('node-fetch')





exports.filter_main = (req, res) => {
    // render the files that uploaded to mongo
    res.render('filter', {a_style: 'display: none;'});
};

exports.search_result = (req, res, next) => {
    req.body.fromDate = req.body.toDate = '2010-12-01';
    req.body.fromTime = '09:00';
    req.body.toTime = '14:00';
    const fromQuery = req.body.fromDate + 'T' + req.body.fromTime + ':00.000Z'
    const toQuery = req.body.toDate + 'T' + req.body.toTime + ':00.000Z'
    
    //select retails from mongoDB by date

    debug(fromQuery + ' --__--> ' + toQuery);
    Retail.find({date : {$gte: new Date(fromQuery), $lte: new Date(toQuery) }}, {retail_id: 1, customer_id: 1, items: 1} , (err, docs)=>{
        if (err) {return next(err); }
        // docs.forEach(e => debug(e['items']));
        
        async.series([
            async.apply(getStatistic, docs),
            // async.apply(sleep, 3000)
            async.apply(mongoDBResponse2csv, docs),
            async.apply(bigMLController,  './public/outCSVs/mongoDBQuery.csv')  
        ], 
        function(err, result){
            if(err) {return next(err);}
            const mostPopular = `${sortedDateItems[0][0]} was bought in ${sortedDateItems[0][1]} different retails.`
          res.render('filter', {a_style: 'display: inline;', most_popular_item: mostPopular})
        });
    });
}

exports.show_graph_results = (req, res, next) => {

    async.series([readFileCSV], function(err, result){
      if(err) {return next(err);}
      res.render('resGraph', 
      {
        cluster0_size: resBatchFile['cluster0'].length,
        cluster0_text:  resBatchFile['cluster0'].join(),
        cluster1_size: resBatchFile['cluster1'].length,
        cluster1_text:  resBatchFile['cluster1'].join(),
        cluster2_size: resBatchFile['cluster2'].length,
        cluster2_text:  resBatchFile['cluster2'].join(),
        cluster3_size: resBatchFile['cluster3'].length,
        cluster3_text:  resBatchFile['cluster3'].join()
    });      
    });
};

const getStatistic = (docs, cb)=> {
  dateItems = {};
  sortedDateItems = [];
  docs.forEach(el => el['items'].forEach(item =>{
    if(dateItems[item] == null) {dateItems[item] = 1;}
    else dateItems[item] += 1;
  }))
  
  // dateItems.forEach( (key, val) => sorted.push([key, val]))
  for(var it in dateItems){
    sortedDateItems.push([it, dateItems[it]]);
  }
  sortedDateItems.sort((a,b)=>{return b[1] - a[1]});
  
  debug(sortedDateItems[0]);
  cb(null);
} 
const downloadURL  = async  (url, pathto) => {
    debug('Downloading From: ' + url);
    // url ='https://bigml.io/andromeda/batchcentroid/5d615668529963040900fd33/download?username=mark5589;api_key=8e12ffdb67a89003140d736bf63a055bbde9f2a1'
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    await streamPipeline(response.body, fs.createWriteStream(pathto));
  }

  // Function for downloading file using wget
const download_file_wget = function(file_url, cb) {
    request(file_url).pipe(fs.createWriteStream('doodle.csv'));
    cb(null);
  };


  function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback(null);
}


const bigMLController = (pathtoFile, cb) => {
    debug('request to bigML');
    connection = new bigml.BigML('cyberpunks5512', 'b3d538219d7b18fd87eb04db7d46386aeb344e28');
    var source = new bigml.Source();
    source.create(pathtoFile, function(error, sourceInfo) {
      if (!error && sourceInfo) {
        var dataset = new bigml.Dataset();
        dataset.create(sourceInfo, function(error, datasetInfo) {
          if (!error && datasetInfo) {
            var cluster = new bigml.Cluster();
            cluster.create(datasetInfo, {k: 4}, function (error, clusterInfo) {
              if (!error && clusterInfo) {
                var batchCentroid = new bigml.BatchCentroid();
                batchCentroid.create(clusterInfo, datasetInfo, {all_fields: true}, function(error, batchInfo){
                    // console.log(batchInfo)
                    const download_api_string = '/download?username=mark5589;api_key=8e12ffdb67a89003140d736bf63a055bbde9f2a1'
                    const batchCentroidResourse = batchInfo['object']['resource'];
                    const httpsPrefix = 'https://bigml.io/andromeda/';
                    const httpRequest = httpsPrefix + batchCentroidResourse + download_api_string;
                    debug("URL to BATCH:" + httpRequest + '<<<');
                    URLDownload.push(httpRequest);                  
                    sleep(10000, () => {
                        request(httpRequest).pipe(fs.createWriteStream('./public/outCSVs/batchCentroidRes.csv'));
                    })
                    
                    // https://bigml.io/andromeda/batchcentroid/5d5d072de47684734100d51a/download?username=mark5589;api_key=8e12ffdb67a89003140d736bf63a055bbde9f2a1
                    cb(null);
                });
                
              }
            });
          }
        });
      }
    });
}

const mongoDBResponse2csv = (res, cb) => {
    debug('saving to file...');
    const fields = ['retail_id', 'customer_id', 'items']; 
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(res);
    // let csv = json2csv(res);
    // const filepath = path.join(__dirname, '../public/outCSVs','progMONGO.csv');
    fs.writeFile('./public/outCSVs/mongoDBQuery.csv', csv, (err)=>{
        if (err) throw err;
       
       cb(null);
    });
}

const readFileCSV = (cb) => {
  resBatchFile['cluster0'] = [];
  resBatchFile['cluster1'] = [];
  resBatchFile['cluster2'] = [];
  resBatchFile['cluster3'] = [];
 

  
  debug('reading Batch centroid csv file..')
  fs.createReadStream('./public/outCSVs/batchCentroidRes.csv')
  .pipe(csv())
  .on('data', row => {
    let mCluster = row['cluster'];
    mCluster = String(mCluster).toLowerCase().replace(' ','');
    let mRetailID = row['retail_id'];
    // debug(mCluster);
    if(mCluster.length > 2){

      resBatchFile[mCluster].push(mRetailID);

      if(resBatchFile[mCluster].length % 5 == 0){ resBatchFile[mCluster].push('<br>');}
    }
  })
  .on('end', () => {
    console.log('end reading csv batch centroid');
    // debug(resBatchFile);
    debug('size of cluster 0: '+resBatchFile['cluster0'].length)
    debug('size of cluster 1: '+resBatchFile['cluster1'].length)
    debug('size of cluster 2: '+resBatchFile['cluster2'].length)
    debug('size of cluster 3: '+resBatchFile['cluster3'].length)
    debug('arr: '+resBatchFile);
    cb(null);
  });

  
}



