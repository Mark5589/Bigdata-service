const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // render the files that uploaded to mongo
    res.render('filter');
});

router.post('/filteredData', (req, res) => {
    // get from mongo, and from the file all the records
    // res.send(req.body.fromDate);
    const result = req.body.fromDate + req.body.toDate
    res.send(result);
});

// router.get('/tst/:id', (req, res) => {
//     res.send(req.params.id)
// });

module.exports = router;