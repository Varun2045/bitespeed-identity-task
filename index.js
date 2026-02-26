const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('./database');
const Contact = require('./Contact');

const app = express();
const PORT = process.env.PORT || 3000; // Updated to handle hosting later

app.use(express.json());

// Sync the database to ensure the "Contacts" table exists
sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database & tables created!");
  })
  .catch(err => {
    console.error("❌ Unable to connect to the database:", err);
  });

// The main Identity Reconciliation endpoint
app.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;

  // 1. Validation: Must have at least one identifier
  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Email or phoneNumber required" });
  }

  // 2. Find all contacts that match the provided email OR phone
  const matchedContacts = await Contact.findAll({
    where: {
      [Op.or]: [
        { email: email || null },
        { phoneNumber: phoneNumber || null }
      ]
    }
  });

  // 3. NO MATCH: Create a new Primary contact
  if (matchedContacts.length === 0) {
    const newContact = await Contact.create({
      email,
      phoneNumber,
      linkPrecedence: 'primary'
    });
    
    return res.json({
      contact: {
        primaryContatctId: newContact.id, // Fixed to match Bitespeed's typo
        emails: [newContact.email].filter(Boolean),
        phoneNumbers: [String(newContact.phoneNumber)].filter(Boolean),
        secondaryContactIds: []
      }
    });
  }

  // 4. FIND ALL RELATED CONTACTS (Recursive search)
  const primaryIds = new Set();
  matchedContacts.forEach(c => {
    primaryIds.add(c.linkPrecedence === 'primary' ? c.id : c.linkedId);
  });

  let allRelated = await Contact.findAll({
    where: {
      [Op.or]: [
        { id: Array.from(primaryIds) },
        { linkedId: Array.from(primaryIds) }
      ]
    }
  });

  // 5. DETERMINE THE TRUE PRIMARY (The oldest one)
  allRelated.sort((a, b) => a.createdAt - b.createdAt);
  const primaryContact = allRelated.find(c => c.linkPrecedence === 'primary') || allRelated[0];

  // 6. MERGE PRIMARIES: If we linked two different primary accounts
  const otherPrimaries = allRelated.filter(c => c.linkPrecedence === 'primary' && c.id !== primaryContact.id);
  
  if (otherPrimaries.length > 0) {
    for (const other of otherPrimaries) {
      await Contact.update(
        { linkPrecedence: 'secondary', linkedId: primaryContact.id },
        { where: { [Op.or]: [{ id: other.id }, { linkedId: other.id }] } }
      );
    }
    // Refresh the list after merging
    allRelated = await Contact.findAll({
      where: {
        [Op.or]: [{ id: primaryContact.id }, { linkedId: primaryContact.id }]
      }
    });
  }

  // 7. CREATE SECONDARY: If there's new info in this request
  const emailExists = allRelated.some(c => c.email === email);
  const phoneExists = allRelated.some(c => c.phoneNumber === phoneNumber);

  if ((email && !emailExists) || (phoneNumber && !phoneExists)) {
    const newSecondary = await Contact.create({
      email,
      phoneNumber,
      linkedId: primaryContact.id,
      linkPrecedence: 'secondary'
    });
    allRelated.push(newSecondary);
  }

  // 8. CONSOLIDATE DATA FOR RESPONSE
  const emails = [...new Set([primaryContact.email, ...allRelated.map(c => c.email)])].filter(Boolean);
  const phoneNumbers = [...new Set([primaryContact.phoneNumber, ...allRelated.map(c => String(c.phoneNumber))])].filter(Boolean);
  const secondaryContactIds = allRelated
    .filter(c => c.id !== primaryContact.id)
    .map(c => c.id);

  res.json({
    contact: {
      primaryContatctId: primaryContact.id, // Fixed to match Bitespeed's typo
      emails,
      phoneNumbers,
      secondaryContactIds // Array of secondary contact IDs
    }
  });
});

app.get('/', (req, res) => {
  res.send('Bitespeed Identity Service is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});