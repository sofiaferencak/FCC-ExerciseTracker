const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Connect to database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGOO, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
  console.log(`successfully connected`);
  }).catch((e)=>{
  console.log(`not connected`);
  });

//Create schema & model for users input
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required : true
  }
});
let User = mongoose.model('User', userSchema);

//Create schema & model for exercises input
const exerciseSchema = mongoose.Schema({
  userId: {type: String, required: true},
  description: String,
  duration: Number,
  date : Date
});
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
//this let's us grab the body of the request
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Create and save new users in the database
app.post('/api/users', async (req, res) => {
  const newUser = new User({username: req.body.username});
  const user = await newUser.save();
  res.json(user);
});

//Add exercise to an user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  const user = await User.findById(id);
  if (!user){
    res.json('Could not found user');
  }else{
    const newExercise = new Exercise({
      userId: user._id,
      description,
      duration,
      date : date ? new Date(date) : new Date()
    })
    const exercise = await newExercise.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    })
  }
})

//Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  if (!users){
    res.send('No users');
  }else{
  res.json(users);
  }
});

//Get logs of user
app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const {from, to, limit} = req.query;
  const user = await User.findById(id);
  if (!user){
    res.send('Can not find user');
    return;
  }
  let dateQuery = {};
  if (from){
    const fromDate = new Date(from);
    if (fromDate === 'Invalid date'){
      res.send('Invalid date');
      return;
    }
    dateQuery['$gte'] = fromDate;
  }
  if (to){
    const toDate = new Date(to);
    if (toDate === 'Invalid date'){
      res.send('Invalid date');
      return;
    }
    dateQuery['$lte'] = toDate;
  }
  const filter = {
    userId: id
  }
  if (from || to){
    filter.date = dateQuery;
  }
  //+limit to parse the limit given or if not limit then 1000
  const exercises = await Exercise.find(filter).limit(+limit ?? 1000);
  const log = exercises.map(each => ({
    description: each.description,
    duration: each.duration,
    date: each.date.toDateString()
  }));
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
