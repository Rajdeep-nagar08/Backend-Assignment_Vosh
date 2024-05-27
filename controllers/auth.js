const User = require('../models/user');
const { hashPassword,comparePassword  } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

exports.register = async (req, res) => {
  try {
    const { name, email, password, photo, bio, phone, isPublic, isAdmin } = req.body;

    // Check if email is valid
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check password complexity
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character' });
    }

    // Set the user's role based on isAdmin
    const role = isAdmin ? 'admin' : 'user';

    const hashedPassword = await hashPassword(password);
    const user = new User({ name, email, password: hashedPassword, photo, bio, phone, isPublic, role });

    const token = generateToken({ userId: user._id, role: user.role });

    await user.save();

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


function isStrongPassword(password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{":;'?/>.<,])(?=.*\w).{8,}$/;
    return passwordRegex.test(password);
  }
  

exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if email is valid
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Compare passwords
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

  
      // Generate JWT token
      const token = generateToken({ userId: user._id, role: user.role });
      const message = 'User logged in successfully';
  
      // Return user details along with the token and message
      res.json({ message, token });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  
exports.logout = async (req, res) => {
    try {
      const { email } = req.body;

      // Check if email is provided
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      // Check if email is valid
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const token = generateToken({ userId: user._id, role: user.role });
      // clear the JWT token from the client-side means remove from localStorage
      res.json({ message: 'User logged out successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
