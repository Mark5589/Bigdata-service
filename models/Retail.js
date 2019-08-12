const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RetailSchema = new Schema({
    retail_id: {type: String, required: true},
    date: {type: Date, required: true},
    customer_id: {type: Number, required: true},
    items: {type: [String]}
});

RetailSchema
.virtual('url')
.get(() => {
    return '/catalog/retail/' + this._id;
});

module.exports = mongoose.model('Retail', RetailSchema);