const express = require('express');
const router = express.Router();
const Retail = require('../models/Retail')
const filter_controller = require('../controllers/filterController');


router.get('/', filter_controller.filter_main);

router.post('/', filter_controller.search_result);

router.get('/filteredData', filter_controller.show_graph_results);

// router.get('/tst/:id', (req, res) => {
//     res.send(req.params.id)
// });

module.exports = router;