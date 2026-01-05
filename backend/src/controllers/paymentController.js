const Payment = require('../models/Payment');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Generate unique payment code
const generatePaymentCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PAY';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create payment request
exports.createPaymentRequest = async (req, res) => {
  try {
    const { planId, planName, amount } = req.body;
    const userId = req.user.id;

    // Validate plan
    const validPlans = ['oneMonth', 'threeMonths', 'oneYear'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has pending payment
    const existingPayment = await Payment.findOne({
      userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingPayment) {
      return res.status(200).json({
        message: 'You already have a pending payment',
        payment: existingPayment
      });
    }

    // Generate unique payment code
    let paymentCode;
    let isUnique = false;
    while (!isUnique) {
      paymentCode = generatePaymentCode();
      const existing = await Payment.findOne({ paymentCode });
      if (!existing) isUnique = true;
    }

    // Create payment request
    const payment = new Payment({
      userId,
      planId,
      planName,
      amount,
      paymentCode,
      userEmail: user.email,
      userName: user.name,
      bankInfo: {
        accountName: 'TRAN HUU TAI',
        accountNumber: '175678888',
        bankName: 'VIB'
      }
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment request created successfully',
      payment: {
        id: payment._id,
        planId: payment.planId,
        planName: payment.planName,
        amount: payment.amount,
        paymentCode: payment.paymentCode,
        bankInfo: payment.bankInfo,
        expiresAt: payment.expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit payment confirmation
exports.submitPaymentConfirmation = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId,
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found or already processed' });
    }

    // Check if payment is expired
    if (payment.expiresAt < new Date()) {
      payment.status = 'expired';
      await payment.save();
      return res.status(400).json({ message: 'Payment request has expired' });
    }

    // Update payment status
    payment.submittedAt = new Date();
    await payment.save();

    // Send email to admin
    try {
      await emailService.sendPaymentNotificationToAdmin({
        userName: payment.userName,
        userEmail: payment.userEmail,
        planName: payment.planName,
        amount: payment.amount,
        paymentCode: payment.paymentCode,
        paymentId: payment._id,
        submittedAt: payment.submittedAt
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      message: 'Payment confirmation submitted. Please wait 3-10 minutes for admin verification.',
      payment: {
        id: payment._id,
        status: payment.status,
        submittedAt: payment.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting payment confirmation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's payments
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.status(200).json({
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body; // status: 'verified' or 'rejected'
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('userId');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    payment.status = status;
    payment.verifiedAt = new Date();
    payment.verifiedBy = adminId;
    if (notes) payment.notes = notes;

    await payment.save();

    // If verified, update user's premium status
    if (status === 'verified') {
      const user = await User.findById(payment.userId);
      if (user) {
        // Calculate premium expiry date based on plan
        let premiumDays = 0;
        switch (payment.planId) {
          case 'oneMonth':
            premiumDays = 30;
            break;
          case 'threeMonths':
            premiumDays = 90;
            break;
          case 'oneYear':
            premiumDays = 365;
            break;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + premiumDays);

        user.premiumStatus = 'premium';
        user.premiumExpiryDate = expiryDate;
        await user.save();

        // Send confirmation email to user
        try {
          await emailService.sendPaymentConfirmationToUser({
            userEmail: user.email,
            userName: user.name,
            planName: payment.planName,
            amount: payment.amount,
            expiryDate
          });
        } catch (emailError) {
          console.error('Error sending user confirmation:', emailError);
        }
      }
    }

    res.status(200).json({
      message: `Payment ${status} successfully`,
      payment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
