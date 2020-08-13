const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/toDoListDB', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connected!'))
  .catch(err => {
    console.log(`DB Connection Error: ${err.message}`);
  });

const toDoListSchema = new mongoose.Schema({
	name: String
});

const Item = mongoose.model("Item", toDoListSchema);

const item1 = new Item({
	name: "Welcome to your todolist!"
});

const item2 = new Item({
	name: "Hit the + button to add a new item."
});

const item3 = new Item({
	name: "<-- Hit this to delete an item."
});

const defaultItem = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [toDoListSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/', (req, res) => {
	
	Item.find({}, (err, foundItems) => {
	    if (foundItems.length === 0) {
	    	
	    	Item.insertMany(defaultItem, (err) => {
	            if (err) {
	            	console.log(err);
	            } else {
	            	console.log("Items succesfully added");
	            }
            });
            res.redirect('/');
	    } else {
	    	res.render('list', {listTitle: 'Today', newListItems: foundItems});
	    }
    });	
});

app.get('/:customListName', (req, res) => {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({name: customListName}, (err, foundList) => {
		if (!err) {
			if (!foundList) {
				//create a new list
				const list = new List({
		            name: customListName,
		            items: defaultItem
	            });

	            list.save();
	            res.redirect('/' + customListName);
			} else {
				//show an existing list
				res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
			}
		}
	});
});

app.post('/', (req, res) => {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	if (listName === 'Today') {
		item.save();
        res.redirect('/');
	} else {
		List.findOne({name: listName}, (err, foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', (req, res) => {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		
		Item.findByIdAndRemove(checkedItemId, (err) => {
		    if (err) {
		    	console.log(err);
		    } else {
		    	console.log("Items removed succesfully");
		    	res.redirect('/');
		    }
	    });    
	} else {
		List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
			if (!err) {
				res.redirect('/' + listName);
			}
		});
	}	
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});