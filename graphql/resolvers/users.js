const { ApolloError } = require('apollo-server-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

module.exports = {
  Mutation: {
    async registerUser(_, { registerInput: { username, email, password } }) {
      // check if email exists
      const emailExists = await User.findOne({ email });

      // throw error if email exists
      if (emailExists) {
        throw new ApolloError(
          `A user named ${username} has already registered with the email ${email}.`,
          USER_ALREADY_EXISTS
        );
      }

      // encrypt password
      const encryptedPassword = await bcrypt.hash(password, 10);

      // build mongoose model (User)
      const newUser = new User({
        username,
        email: email.toLowerCase(),
        password: encryptedPassword,
      });

      // JWT define params
      const secret = process.env.JWT_SECRET;
      const payload = {
        user_id: newUser._id,
        email,
      };
      const options = { expiresIn: '2hr' };

      // JWT generate token
      const token = jwt.sign(payload, secret, options);

      // JWT add token to new user
      newUser.token = token;

      // create new user in MongoDB
      const res = await newUser.save();

      // return new user
      return {
        id: res.id,
        ...res._doc,
      };
    },
    async loginUser(_, { loginInput: { email, password } }) {
      // check if a user with loginInput.email exists
      const user = await User.findOne({ email });

      // if user does not exist throw error
      if (!user) {
        throw new ApolloError(
          `A user with email ${email} was not found`,
          USER_LOGIN_EMAIL_NOT_FOUND
        );
      }

      // check user entered password against encrypted user.password
      const isValidPassword = await bcrypt.compare(password, user.password);

      // if valid credentials generate token
      if (user && isValidPassword) {
        // JWT define params
        const secret = process.env.JWT_SECRET;
        const payload = {
          user_id: user._id,
          email,
        };
        const options = { expiresIn: '2hr' };

        // JWT generate token
        const token = jwt.sign(payload, secret, options);

        // JWT add token to existing user
        user.token = token;

        // return user
        return {
          id: user.id,
          ...user._doc,
        };
      } else {
        // if password is invalid throw error
        throw new ApolloError(
          `Incorrect password entered`,
          USER_LOGIN_PASSWORD_INCORRECT
        );
      }
    },
  },
  Query: {
    // find user by id
    user: (_, { ID }) => User.findById(ID),
  },
};
