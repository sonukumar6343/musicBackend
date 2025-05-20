// controllers/loginController.js
import bcrypt from "bcryptjs";
import User from "../model/userModel.js";
import Student from "../model/studentModel.js";
import { createToken } from "../utils/generateToken.js";
import crypto from 'crypto';

import jwt from "jsonwebtoken";
import Otp from "../model/otpModel.js";
import formatUserData from "../utils/formatInput.js";
import {transporter} from "../utils/emailTransporter.js"


export const shortcutWalalogin = async (req, res) => {
  try {
    const { email, mobileNumber, password } = req.body;

    if ((!email && !mobileNumber) || !password?.trim()) {
      return res
        .status(400)
        .json({ error: "Email or mobile number and password are required" });
    }

    let user;

    // Normalize email
    const normalizedEmail = email?.trim().toLowerCase();

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // secure in production
      sameSite: "lax",
    };

    // Check if user or student exists
    if (normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    } else if (mobileNumber) {
      user = await User.findOne({ mobileNumber });
    }
    if (!user) {
      // If neither user nor student found
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check User
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {id: user._id, email:user.email,  role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "3h" }
      );

      return res
        .cookie("token", token, options)
        .status(200)
        .json({
          success: true,
          message: `${user.role} login successful`,
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const login = async (req, res) => {
//   try {
//     const { email, mobileNumber, password } = req.body;

//     if ((!email && !mobileNumber) || !password?.trim()) {
//       return res
//         .status(400)
//         .json({ error: "Email or mobile number and password are required" });
//     }

//     let user, student;

//     // Normalize email
//     const normalizedEmail = email?.trim().toLowerCase();

//     const options = {
//       expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // secure in production
//       sameSite: "lax",
//     };

//     // check user exists
//     if (normalizedEmail) {
//       user = await User.findOne({ email: normalizedEmail });
//       student = await Student.findOne({ email: normalizedEmail });
//     } else if (mobileNumber) {
//       user = await User.findOne({ mobileNumber });
//       student = await Student.findOne({ mobileNumber });
//     }

//     if (user) {
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Invalid credentials" });
//       }

//       // return res.status(200).json({
//       //   success: true,
//       //   message: `${user.role || "User"} credentials are valid`,
//       // });

//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "3h" }
//       );

//        return res
//         .cookie("token", token, options)
//         .status(200)
//         .json({
//           success: true,
//           message: `${user.role} login successful`,
//           token,
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//           },
//         });
//     }

//     if (student) {
//       const isMatch = await bcrypt.compare(password, student.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Invalid credentials" });
//       }

//       const token = jwt.sign(
//         { userId: student._id, role: "student" },
//         process.env.JWT_SECRET,
//         { expiresIn: "12h" }
//       );

//       return res
//         .cookie("token", token, options)
//         .status(200)
//         .json({
//           success: true,
//           message: "Student login successful",
//           token,
//           user: {
//             id: student._id,
//             name: student.name,
//             email: student.email,
//             role: "student",
//           },
//         });
    
//     // Check for Student
    
//     }

//     // If neither user nor student found
//     return res.status(404).json({ success: false, message: "User not found" });

//       // return res.status(200).json({
//       //   success: true,
//       //   message: "Student credentials are valid",
//       //   // token: createToken(student),
//       //   // student: { id: student._id, name: student.name, role: "student", email: student.email }
//       // });
    

    
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }}
// ;

// export const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = formatUserData(req.body);

//     const record = await Otp.findOne({ email });
//     if (!record) {
//       return res.status(404).json({ message: "OTP record not found" });
//     }

//     if (record.expiresAt < Date.now()) {
//       await Otp.deleteOne({ email });
//       return res.status(400).json({ message: "OTP has expired" });
//     }

//     const isOtpValid = await bcrypt.compare(otp, record.otp);
//     if (!isOtpValid) {
//       return res.status(401).json({ message: "Invalid OTP" });
//     }

//     // OTP is valid
//     await Otp.deleteOne({ email });

//     // First, check if it's a registered user
//     const user = await User.findOne({ email });
//     if (user) {
//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );

//       return res.status(200).json({
//         success: true,
//         message: `${user.role} login successful`,
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//         },
//       });
//     }

//     // Then check if it's a student
//     const student = await Student.findOne({ email });
//     if (student) {
//       const token = jwt.sign(
//         { userId: student._id, role: "student" },
//         process.env.JWT_SECRET,
//         { expiresIn: "12h" }
//       );


//        const options={
//             expires:new Date(Date.now()+3*24*60*60*1000),
//             httpOnly:true,
//         }
//         res.cookie("token",token,options).status(200).json({
//             success:true,
//             token,
//             user,
//             message:'Logged in successfully',
//         });
//     }

//       // return res.status(200).json({
//       //   success: true,
//       //   message: "Student login successful",
//       //   token,
//       //   student: {
//       //     id: student._id,
//       //     name: student.name,
//       //     email: student.email,
//       //     role: "student",
//       //   },
//       // });
    

//     // Add at the end before catch block
//     return res.status(404).json({ success: false, message: "User not found" });
//   } catch (error) {
//     console.error("OTP verification error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during OTP verification",
//       error: error.message,
//     });
//   }
// };



// Helper function to send OTP via email
export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Login Verification</h2>
        <p>Your One-Time Password (OTP) for login is:</p>
        <h1 style="font-size: 32px; background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Step 1: Generate OTP and send it
export const login = async (req, res) => {
  try {
    const { email, mobileNumber, password } = req.body;
    if ((!email && !mobileNumber) || !password?.trim()) {
      return res
        .status(400)
        .json({ error: "Email or mobile number and password are required" });
    }
    
    let user;
    // Normalize email
    const normalizedEmail = email?.trim().toLowerCase();
    console.log("normalizedEmail is:", normalizedEmail);
    
    // Check user exists
    if (normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    } else if (mobileNumber) {
      user = await User.findOne({ mobileNumber });
    }
    if (!user) {
          // If neither user nor student found
      return res.status(404).json({ success: false, message: "User not found" });
    }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
    
    if (!normalizedEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required for OTP verification" 
      });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Delete any existing OTP for this email
    await Otp.findOneAndDelete({ email: normalizedEmail });
    
    // Create new OTP record
    await Otp.create({
      email: normalizedEmail,
      otp: otp,
      verified: false
      // createdAt and expiry are handled by the schema
    });
    console.log("otp is ", otp);
    
    // Send OTP via email
    await sendOtpEmail(normalizedEmail, otp);
    
    // Store user data in session or another secure temporary storage
    // Using req.session assuming you have express-session middleware
    if (!req.session) {
      req.session = {};
    }
    req.session.pendingAuth = {
      userId: user._id,
      role: user.role,
      email: normalizedEmail
    };
    
    return res.status(200).json({
      success: true,
      message: "OTP sent to your email address",
      requiresOtp: true
    });
    
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Step 2: Verify OTP and provide token - Modified to not require email, userId, and role
export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({ 
        success: false,
        message: "OTP is required" 
      });
    }
    
    // Retrieve pending auth data from session
    if (!req.session || !req.session.pendingAuth) {
      return res.status(400).json({ 
        success: false,
        message: "No active login session found. Please login again." 
      });
    }
    
    const { userId, role, email } = req.session.pendingAuth;
    
    if (!email || !userId || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Session is missing required information" 
      });
    }
    
    // Find the OTP record by email and OTP value
    const otpRecord = await Otp.findOne({ email, otp });
    
    // Check if OTP exists
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid OTP or OTP expired. Please request a new OTP." 
      });
    }
    
    // Check if OTP is already verified
    if (otpRecord.verified) {
      return res.status(400).json({ 
        success: false,
        message: "OTP already used. Please request a new OTP." 
      });
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // OTP is valid, generate JWT token
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: role === "student" ? "12h" : "3h" }
    );
    
    // Get user data based on role
    let userData;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
          success: false,
        message: "User not found"
      })
   }
  
    
    // Clear the pending auth data
    delete req.session.pendingAuth;
    
    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, 
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
    };
    console.log("logged in successfully with user data is:",user);
    
    // Return success response with token
    res
      .cookie("token", token, options)
      .status(200)
      .json({
        success: true,
        message: `${role} login successful`,
        token,
        user: user
      });
      
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Modified: Resend OTP to work with session
export const resendOtp = async (req, res) => {
  try {
    // Retrieve email from session instead of request body
    if (!req.session || !req.session.pendingAuth || !req.session.pendingAuth.email) {
      return res.status(400).json({ 
        success: false,
        message: "No active login session found. Please login again." 
      });
    }
    
    const email = req.session.pendingAuth.email;
    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Delete old OTP and create new one
    await Otp.findOneAndDelete({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp: otp,
      verified: false
    });
    
    // Send OTP via email
    await sendOtpEmail(normalizedEmail, otp);
    
    return res.status(200).json({
      success: true,
      message: "OTP resent to your email address"
    });
    
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// export const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = formatUserData(req.body);

//     const record = await Otp.findOne({ email });
//     if (!record) {
//       return res.status(404).json({ message: "OTP record not found" });
//     }

//     if (record.expiresAt < Date.now()) {
//       await Otp.deleteOne({ email });
//       return res.status(400).json({ message: "OTP has expired" });
//     }

//     const isOtpValid = await bcrypt.compare(otp, record.otp);
//     if (!isOtpValid) {
//       return res.status(401).json({ message: "Invalid OTP" });
//     }

//     // OTP is valid, delete OTP from DB
//     await Otp.deleteOne({ email });

//     // Define cookie options (common for both user and student)
//     const options = {
//       expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // secure in production
//       sameSite: "lax",
//     };

//     // Check for User
//     const user = await User.findOne({ email });
//     if (user) {
//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );

//       return res
//         .cookie("token", token, options)
//         .status(200)
//         .json({
//           success: true,
//           message: `${user.role} login successful`,
//           token,
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//           },
//         });
//     }

//     // Check for Student
//     const student = await Student.findOne({ email });
//     if (student) {
//       const token = jwt.sign(
//         { userId: student._id, role: "student" },
//         process.env.JWT_SECRET,
//         { expiresIn: "12h" }
//       );

//       return res
//         .cookie("token", token, options)
//         .status(200)
//         .json({
//           success: true,
//           message: "Student login successful",
//           token,
//           user: {
//             id: student._id,
//             name: student.name,
//             email: student.email,
//             role: "student",
//           },
//         });
//     }

//     // If neither user nor student found
//     return res.status(404).json({ success: false, message: "User not found" });

//   } catch (error) {
//     console.error("OTP verification error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during OTP verification",
//       error: error.message,
//     });
//   }
// };


export const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [user, student] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Student.findOne({ email: normalizedEmail }),
    ]);

    const account = user || student;

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    account.password = newPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [user, student] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Student.findOne({ email: normalizedEmail }),
    ]);

    const account = user || student;

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = createToken(account, "1h");

    res.status(200).json({
      message: "Reset token generated",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { id, role } = decoded;

    if (!id || !role) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    const account =
      role === "student" ? await Student.findById(id) : await User.findById(id);

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    account.password = newPassword;
    await account.save();

    const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
    return res.status(200).json({
      success: true,
      message: `${capitalizedRole} password has been reset successfully`,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(400).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};
