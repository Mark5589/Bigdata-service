const express = require('express');
const router = express.Router();

// Req. for file reading
const UPLOADS_DIR = './public/uploads';
const XLSX_OUTPUT_DIR = './public/uploads/xlsx/'
const fs = require('fs');
const xlsxj = require('xlsx-to-json');


// Controller
const retail_controller = require('../controllers/retailController');
const debug = require('debug')('dev::');
const async = require('async');

// MongoDB Schema models
const Retail = require('../models/Retail');
const Customer = require('../models/Customer');


// Reading all files in the public/uploads dir, render the files.
router.get('/' , retail_controller.index);

router.get('/file/:name' , retail_controller.load_file);



module.exports = router;

