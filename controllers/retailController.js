const Retail = require('../models/Retail');
const fs = require('fs');

let retailArray = [];
let customerArray = [];
let retailUnique = new Set();
let customerUnique = new Set();

let retialSchemaArray = [];
let customerSchemaArray = [];

// Req. for file reading

const UPLOADS_DIR = './public/uploads/';
const XLSX_OUTPUT_DIR = './public/uploads/xlsx/'
const xlsxj = require('xlsx-to-json');


// Controller
const debug = require('debug')('dev::');
const async = require('async');

// MongoDB Schema models

const Customer = require('../models/Customer');


exports.retail_list = (req, res) => {
    res.send('NOT IMPLEMENTED REATAIL LIST');
}

exports.index = (req, res) => {
    
    let filesArr = getFiles();

    res.render('mongodbupload', {records: filesArr});
    // console.log(`ARRAY OF FILES ${filesArr}`);
    debug('files in dir ' + filesArr);
}

exports.load_file = (req, res) => {
    let date = new Date();
    let timeString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}-${date.getHours()}-${date.getMinutes()}--`;
      let filesArr = getFiles();
      if(filesArr.includes(req.params.name)){
          debug('selected file found');
          //process the file: xlsx -> json
           xlsxj({
              input: UPLOADS_DIR+"/"+req.params.name, 
              output: XLSX_OUTPUT_DIR + req.params.name + ".json"
            }, function(err, result) {
              if(err) {
                console.error(err);
              }else {
                //console.log(result);
              }
            });
  
          
          // send the file to monogo
          // send the file to FTP server to RAW save
          //delete the file from the server
  
          // read file json
          let filePath = XLSX_OUTPUT_DIR + req.params.name + ".json"
          let filejsonformat = readFileJson(filePath);
          filejsonformat.sort(sortbyInvoiceNo);
  
          //build unique retailUnique
          filejsonformat.forEach(e => retailUnique.add(e['InvoiceNo']));
  
          // build customerUnique
          filejsonformat.forEach(e => customerUnique.add(e['CustomerID']));
          
          // collect same category record in chuncks.
          buildByKey(filejsonformat, 'InvoiceNo', retailUnique, retailArray);
          buildByKey(filejsonformat, 'CustomerID', customerUnique, customerArray);
          
          // prepare the data to monogoDB
          retialSchemaArray = buildSchemaRetailArray(retailUnique, retailArray);
          customerSchemaArray = buildSchemaCustomerArray(customerUnique, customerArray);
          
          //
          // retialSchemaArray.forEach(e => db.collection.insert(retailCreate(e)));
          let schemadataRetail = retialSchemaArray.map(e => retailCreate(e));
          let schemadataCustomer = customerSchemaArray.map(e => customerCreate(e));
          // senddata1(schemadataRetail, schemadataCustomer,req);

        // load Customer records
        // try{
        //     //  Customer.collection.insertMany(schemadataCustomer).then(Retail.collection.insertMany(schemadataRetail))
        //     async.series([Customer.collection.insertMany(schemadataCustomer),
        //       Retail.collection.insertMany(schemadataRetail),
        //       res.send('File added to DB. Return back to search by date.')
        //   ]);
        // }catch(e){ debug(`error: ` + e)}

        // // load Retail records
        try{
            //  const dd  = Retail.collection.insertMany(schemadataRetail);  
           senddata1(schemadataRetail, schemadataCustomer,req);
          
            res.send('File added to DB. Return back to search by date.')
        // res.send(dd)

        }catch(e){ debug(`error: ` + e)}
         
        // res.send(schemadataCustomer);
            // res.send('File added to DB. Return back to search by date.')
      }else{
          res.send('404 error file not found');
      }
  }

// SubjectArr == customerArr / retailArr
const buildSchemaRetailArray = (UniSet, SubjectArr) => {
    const setArr = Array.from(UniSet);
    let res = [];
    for(let key of setArr){
      let reletedToKeyRec = SubjectArr.filter(e =>  e[0]['InvoiceNo'] == key);
      let reletedToKeyObj =  reletedToKeyRec.map(e => e.map(el => el.Description));
      res.push({retailId: key, items: reletedToKeyObj, date: reletedToKeyRec[0][0].InvoiceDate, customerID: reletedToKeyRec[0][0].CustomerID})
    }
    return res;
  };
  
  const buildSchemaCustomerArray = (UniSet, SubjectArr) => {
    const setArr = Array.from(UniSet);
    let res = [];
    for(let key of setArr){
      let reletedToKeyRec = SubjectArr.filter(e =>  e[0]['CustomerID'] == key);
      let reletedToKeyObj =  reletedToKeyRec.map(e => e.map(el => el.InvoiceNo));
      res.push({customerID: key, retailHistory: reletedToKeyObj})
    }
    return res;
  };
  
  
  const getFiles = () =>{
      let filesArr = [];
      const dirents = fs.readdirSync(UPLOADS_DIR, {withFileTypes: true});
      const filesName = dirents
      .filter(dirent => !dirent.isDirectory())
      .map(dirent => dirent.name);
      return filesName;
  };
  
  const readFileJson = (file) => {
    let rawdata = fs.readFileSync(file);
    let jsondata = JSON.parse(rawdata);
    return jsondata;
  };
  
  const sortbyInvoiceNo = (a, b) => {
    return a['InvoiceNo'] - b['InvoiceNo'];
  };
  
  const buildByKey = (filejsonformat, key, UNIQUE_ARR ,GLOBAL_ARR) => {
    const uniarray = [... UNIQUE_ARR];
    // debug(uniarray);
    UNIQUE_ARR.forEach(e => {
    let tmparr = filejsonformat.filter(inner => {
      return inner[key] == e;
    });
    GLOBAL_ARR.push(tmparr);
   });
  };
  
  
  // function for monogoDB
  const customerCreate = (elem) => {
    const customerDetails = {customer_id: elem.customerID, items_history: elem.retailHistory[0]};
    let customer = Customer(customerDetails);
    return customer;
  };
  const retailCreate = (elem) => {
    const retailDetails = {retail_id: elem.retailId, date:elem.date, customer_id: elem.customerID, items: elem.items[0]};
    let retail = Retail(retailDetails);
    return retail;
  };
  
  async function senddata1(schemadataRetail, schemadataCustomer, req){
    debug('sending data to DB');
    // await db.collection('Retail'+req.params.name).insertMany(arr);
    // await db.collection('Customer'+req.params.name).insertMany(arr2);
    await Retail.collection.insertMany(schemadataRetail);
    debug('send retail')
    await Customer.collection.insertMany(schemadataCustomer);          
    debug('send customers')
  }