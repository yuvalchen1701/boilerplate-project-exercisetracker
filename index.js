const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users =  await User.find({}).select("_id username");
  if(!users) {
    res.send('No users');
  } else {
    res.send(users);
  }
});

app.post('/api/users', async(req, res) => {
 const userObj = new User({
    username: req.body.username
  });

  try{
    const user = await userObj.save();
    res.json(user);
  } catch(err) {
    console.log(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      console.log('Could not find user'); // Fixed logging
      return res.status(404).send('User not found'); // Added proper error response
    }

    const exerciseObj = new Exercise({
      user_id: user._id,
      description,
      duration: parseInt(duration), // Ensure duration is parsed correctly
      date: date ? new Date(date) : new Date(),
    });

    const exercise = await exerciseObj.save();

    res.json({
      _id: user._id, // Fixed response key
      username: user.username,
      description: exercise.description,
      duration: parseInt(exercise.duration), // Ensure duration is an integer
      date: new Date(exercise.date).toDateString(), // Convert date to readable format
    });
  } catch (err) {
    console.error('Error saving exercise:', err); // Added detailed logging
    res.status(500).send('There was an error saving the exercise');
  }
});

/*app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if(!user) {
      console.send('Could not find user');
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      const exercise = await exerciseObj.save();

      res.json({
        id: user._id,
        username: user.username,
        description: exercise.description,
        duration: parseInt(exercise.duration),
        date: new Date(exercise.date).toDateString()
      });
    }
  } catch(err) {
    console.log(err);
    res.send("There was an error saving the exercise");
  }    
});*/

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;

  try {
    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("Could not find user");
    }

    // Build filter for exercises
    let dateFilter = {};
    if (from) dateFilter['$gte'] = new Date(from);
    if (to) dateFilter['$lte'] = new Date(to);

    const filter = { user_id: id };
    if (from || to) filter.date = dateFilter;

    // Query exercises with optional limit
    const exercises = await Exercise.find(filter).limit(Number(limit) || 500);

    // Map exercises to log format
    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    // Send the response
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).send("There was an error fetching the logs");
  }
});

/*app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);

  if(!user) {
    res.send("Could not find user");
    return;
  } 
  let dateObj = {};
  if(from) {
    dateObj['$gte'] = new Date(from);
  }
  if(to) {
    dateObj['$lte'] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from||to) {
    filter.date = dateObj;
  }

  const exercise = await Exercise.find(filter).limit(+limit ?? 500);
  const log = exercise.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    log
  });
});*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
