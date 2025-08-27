router.post('/admin/clients/block/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { reason } = req.body;
    
    // Update client document with blocked status
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: req.user._id
      },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Create blocked record
    const blockRecord = await BlockedClient.create({
      clientId: updatedClient._id,
      reason,
      blockedBy: req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      message: 'Client blocked successfully',
      data: { client: updatedClient, blockRecord }
    });

  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add endpoint to get blocked clients
router.get('/admin/clients/blocked', async (req, res) => {
  try {
    const blockedClients = await Client.find({ isBlocked: true });
    res.json({
      success: true,
      data: blockedClients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
