const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Schema = mongoose.Schema;

const goalEnum = {
  MAINTAIN: 'maintain',
  LOSE: 'lose',
  GAIN: 'gain',
};

const activityLevelEnum = {
  SEDENTARY: 'sedentary',
  LIGHTLY_ACTIVE: 'lightly_active',
  MODERATELY_ACTIVE: 'moderately_active',
  VERY_ACTIVE: 'very_active',
  INTENSELY_ACTIVE: 'intensely_active',
};

const activityLevels = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  intensely_active: 1.9,
};

const sexEnum = {
  MALE: 'male',
  FEMALE: 'female',
};

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      enum: Object.values(sexEnum),
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    activityLevel: {
      type: String,
      enum: Object.values(activityLevelEnum),
      required: true,
    },
    goal: {
      type: String,
      enum: Object.values(goalEnum),
      required: true,
    },
    bmr: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.methods.calculateBmr = function () {
  const { sex, age, weight, height, activityLevel, goal } = this;

  //Mifflin - St Jeor Formula
  const bmr =
    sex === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  /* If lose weight, bmr - 500. If gain weight, bmr + 500 */
  let adjustedBmr = bmr;
  if (goal === goalEnum.LOSE) {
    adjustedBmr -= 500;
  } else if (goal === goalEnum.GAIN) {
    adjustedBmr += 500;
  }

  //Total Daily Energy Expenditure (TDEE)
  const tdee = adjustedBmr * activityLevels[activityLevel];

  this.bmr = Math.round(tdee);
  return this.save();
};

userSchema.statics.signup = async function (
  name,
  email,
  password,
  sex,
  age,
  height,
  weight,
  goal,
  activityLevel
) {
  if (!validator.isStrongPassword(password)) {
    throw Error(
      'Password must contain a combination of uppercase letters, lowercase letters, numbers, and symbols.'
    );
  }

  const emailExists = await this.findOne({ email });

  if (emailExists) {
    throw Error('Someone already signed up with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    name,
    email,
    password: hash,
    sex,
    age,
    height,
    weight,
    goal,
    activityLevel,
  });

  return user;
};

userSchema.statics.signin = async function (email, password) {
  if (!email || !password) {
    throw Error('All fields must be filled.');
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw Error('Incorrect email.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw Error('Incorrect password.');
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
