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

const util = require('util')

const streamPipeline = util.promisify(require('stream').pipeline)

const fetch = require('node-fetch')





exports.filter_main = (req, res) => {
    // render the files that uploaded to mongo
    res.render('filter');
};

exports.search_result = (req, res, next) => {
    const fromQuery = req.body.fromDate + 'T' + req.body.fromTime + ':00.000Z'
    const toQuery = req.body.toDate + 'T' + req.body.toTime + ':00.000Z'
    //select retails from mongoDB by date

    debug(fromQuery + ' --__--> ' + toQuery);
    Retail.find({date : {$gte: new Date(fromQuery), $lte: new Date(toQuery) }}, {retail_id: 1, customer_id: 1, items: 1} , (err, docs)=>{
        if (err) {return next(err); }

        // Save the mongo Query to csv file
        // mongoDBResponse2csv(docs)

        // run ML on the csv file
        // bigMLController();
        
        // api_Controllers(docs)
        async.series([
            async.apply(mongoDBResponse2csv, docs),
            async.apply(bigMLController,  './public/outCSVs/mongoDBQuery.csv'),
            async.apply(readFileCSV)
        ], 
        function(err, result){
            if(err) {return next(err);}
          //   res.render('resGraph', 
          //   {
          //     cluster0_size: resBatchFile['cluster0'].length,
          //     cluster0_text:  resBatchFile['cluster0'].join(),
          //     cluster1_size: resBatchFile['cluster1'].length,
          //     cluster1_text:  resBatchFile['cluster1'].join(),
          //     cluster2_size: resBatchFile['cluster2'].length,
          //     cluster2_text:  resBatchFile['cluster2'].join(),
          //     cluster3_size: resBatchFile['cluster3'].length,
          //     cluster3_text:  resBatchFile['cluster3'].join()
          // });
          res.render('filter', {resLink: true})
        });
   
    });
}

// cluster1_text: 'hello',
// cluster2_text: 'hello',
// // cluster3_text: 'hello'
// cluster1_size: resBatchFile['cluster1'].length,
// cluster2_size: resBatchFile['cluster2'].length,
// cluster3_size: resBatchFile['cluster3'].length,
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
    //source.create('./public/ml/test.csv', function(error, sourceInfo) 
    const filepath = '/Users/recon/Documents/studies/year3/Semester-B/4-DATA-Big data/1.1-project/bigData-proj/public/outCSVs/mongoDBQuery.csv';
    const path2 = '/Users/recon/Documents/studies/year3/Semester-B/4-DATA-Big data/1.1-project/bigData-proj/public/ml/test.csv';
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
                    // downloadURL (httpRequest, './public/outCSVs/downloadedBatch');
                    // download_file_wget(httpRequest)
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
        
       // return './public/outCSVs/mongoDBQuery.csv'
       cb(null);
    })
    
    // debug(csv);
}

const readFileCSV = (cb) => {
  resBatchFile['cluster0'] = [];
  resBatchFile['cluster1'] = [];
  resBatchFile['cluster2'] = [];
  resBatchFile['cluster3'] = [];

  // let tmp = 'cluster0';
  // resBatchFile[tmp].push('hello');
  // debug(resBatchFile['cluster0'][0]);
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



