const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    customer_id: {type: String, required: true},
    items_history: {type: [String]}
});

CustomerSchema
.virtual('url')
.get(() => {
    return '/catalog/customer/' + this._id;
});

module.exports = mongoose.model('Customer', CustomerSchema);