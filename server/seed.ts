import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

export async function seedDatabase() {
  console.log('Seeding Apex Campus Lost & Found database...');
  await initDatabase();

  // Clear existing tables in correct dependency order
  await db.exec(`
    DELETE FROM audit_logs WHERE true;
    DELETE FROM notifications WHERE true;
    DELETE FROM handovers WHERE true;
    DELETE FROM matches WHERE true;
    DELETE FROM claims WHERE true;
    DELETE FROM found_items WHERE true;
    DELETE FROM lost_items WHERE true;
    DELETE FROM locations WHERE true;
    DELETE FROM categories WHERE true;
    DELETE FROM users WHERE true;
  `);

  // 1. SEED CATEGORIES (Section 6)
  const categories = [
    { id: 'cat_electronics', name: 'Electronics', description: 'General electrical devices, chargers, power banks, headphones', icon: 'Cpu' },
    { id: 'cat_phones', name: 'Mobile Phones', description: 'Smartphones, feature phones, cellular devices', icon: 'Smartphone' },
    { id: 'cat_laptops', name: 'Laptops', description: 'Notebooks, MacBooks, gaming laptops, chargers', icon: 'Laptop' },
    { id: 'cat_tablets', name: 'Tablets', description: 'iPads, Android tablets, e-readers', icon: 'Tablet' },
    { id: 'cat_student_ids', name: 'Student IDs', description: 'Campus ID cards, library passes, access badges', icon: 'CreditCard' },
    { id: 'cat_books', name: 'Books', description: 'Textbooks, library books, novels, course readers', icon: 'Book' },
    { id: 'cat_wallets', name: 'Wallets', description: 'Wallets, purses, money clips, cardholders', icon: 'Wallet' },
    { id: 'cat_keys', name: 'Keys', description: 'Hostel keys, car keys, locker keys, keychains', icon: 'Key' },
    { id: 'cat_bags', name: 'Bags', description: 'Backpacks, tote bags, laptop bags, gym sacks', icon: 'ShoppingBag' },
    { id: 'cat_clothing', name: 'Clothing', description: 'Jackets, hoodies, caps, scarves, lab coats', icon: 'Shirt' },
    { id: 'cat_jewellery', name: 'Jewellery', description: 'Watches, rings, necklaces, bracelets', icon: 'Watch' },
    { id: 'cat_academic', name: 'Academic Materials', description: 'Calculators, lab manuals, drawing boards, notebooks', icon: 'GraduationCap' },
    { id: 'cat_documents', name: 'Documents', description: 'Passports, certificates, examination slips, files', icon: 'FileText' },
    { id: 'cat_accessories', name: 'Accessories', description: 'Glasses, sunglasses, umbrellas, water bottles', icon: 'Glasses' },
    { id: 'cat_other', name: 'Other', description: 'Miscellaneous campus items', icon: 'HelpCircle' },
  ];

  for (const c of categories) {
    await db.prepare('INSERT INTO categories (id, name, description, icon, status) VALUES (?, ?, ?, ?, \'active\')').run(c.id, c.name, c.description, c.icon);
  }

  // 2. SEED LOCATIONS (Section 7)
  const locations = [
    { id: 'loc_library', name: 'Main Library', description: 'Central campus library & study cubicles', zone: 'Academic Zone' },
    { id: 'loc_ict_lab', name: 'ICT Laboratory', description: 'Computing center & software research labs', zone: 'Science & Tech' },
    { id: 'loc_block_a', name: 'Lecture Block A', description: 'Undergraduate lecture halls A1 - A10', zone: 'Academic Zone' },
    { id: 'loc_block_b', name: 'Lecture Block B', description: 'Postgraduate & seminar rooms B1 - B8', zone: 'Academic Zone' },
    { id: 'loc_theatre', name: 'Main Lecture Theatre', description: '500-seat university auditorium', zone: 'Central Zone' },
    { id: 'loc_cafeteria', name: 'University Cafeteria', description: 'Main dining hall & food court', zone: 'Student Services' },
    { id: 'loc_admin', name: 'Administration Block', description: 'Registrar, Dean of Students & Finance', zone: 'Admin Zone' },
    { id: 'loc_hostels', name: 'Student Hostels / Hall', description: 'Campus residential halls & common rooms', zone: 'Residential Zone' },
    { id: 'loc_sports', name: 'Sports Ground & Pavilion', description: 'Athletics track, gymnasium, soccer field', zone: 'Sports Zone' },
    { id: 'loc_parking', name: 'Main Parking Area', description: 'North campus staff & student vehicle parking', zone: 'Perimeter' },
    { id: 'loc_science_lab', name: 'Science Complex Laboratories', description: 'Chemistry, Physics & Biology wet labs', zone: 'Science & Tech' },
    { id: 'loc_student_center', name: 'Student Union Center', description: 'Clubs, student lounge, recreation hall', zone: 'Student Services' },
  ];

  for (const l of locations) {
    await db.prepare('INSERT INTO locations (id, name, description, zone, status) VALUES (?, ?, ?, ?, \'active\')').run(l.id, l.name, l.description, l.zone);
  }

  // 3. SEED USERS (Section 1 & 2)
  const hashedAdminPass = bcrypt.hashSync('admin123', 10);
  const hashedOfficerPass = bcrypt.hashSync('officer123', 10);
  const hashedStudentPass = bcrypt.hashSync('student123', 10);

  const users = [
    {
      id: 'usr_admin',
      full_name: 'Dr. Michael Sterling',
      student_staff_id: 'ADM-2024-001',
      email: 'admin@campus.edu',
      phone: '+1 (555) 019-2831',
      password: hashedAdminPass,
      role: 'admin',
      account_status: 'active',
      department: 'Campus Administration & Dean of Students',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_officer',
      full_name: 'Officer Raymond Vance',
      student_staff_id: 'SEC-2024-004',
      email: 'security@campus.edu',
      phone: '+1 (555) 019-5520',
      password: hashedOfficerPass,
      role: 'officer',
      account_status: 'active',
      department: 'Campus Security & Lost Property Desk',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_alex',
      full_name: 'Alex Kim',
      student_staff_id: 'STU-2024-8891',
      email: 'alex.kim@campus.edu',
      phone: '+1 (555) 019-3829',
      password: hashedStudentPass,
      role: 'student',
      account_status: 'active',
      department: 'Computer Science & Software Eng',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_sarah',
      full_name: 'Sarah Chen',
      student_staff_id: 'STU-2024-5120',
      email: 'sarah.chen@campus.edu',
      phone: '+1 (555) 019-7411',
      password: hashedStudentPass,
      role: 'student',
      account_status: 'active',
      department: 'Electrical & Electronics Engineering',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_marcus',
      full_name: 'Marcus Johnson',
      student_staff_id: 'STU-2024-3312',
      email: 'marcus.johnson@campus.edu',
      phone: '+1 (555) 019-8832',
      password: hashedStudentPass,
      role: 'student',
      account_status: 'active',
      department: 'School of Business & Finance',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_emily',
      full_name: 'Emily Davis',
      student_staff_id: 'STU-2024-7744',
      email: 'emily.davis@campus.edu',
      phone: '+1 (555) 019-4190',
      password: hashedStudentPass,
      role: 'student',
      account_status: 'active',
      department: 'Faculty of Health Sciences',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const u of users) {
    await db.prepare(`
      INSERT INTO users (id, full_name, student_staff_id, email, phone, password, role, account_status, department, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))
    `).run(u.id, u.full_name, u.student_staff_id, u.email, u.phone, u.password, u.role, u.account_status, u.department, u.avatar_url);
  }

  // 4. SEED LOST ITEMS
  const lostItems = [
    {
      id: 'lost_01',
      item_reference: 'LOST-2026-0001',
      reporter_id: 'usr_sarah',
      category_id: 'cat_laptops',
      item_name: 'HP Pavilion 15 Laptop (Dark Gray)',
      description: '15-inch HP laptop in dark gray/black case. Has a GitHub and React sticker on the lid. Left near the 2nd floor library study carrels.',
      color: 'Black',
      date_lost: '2026-08-25',
      approximate_time: '14:30',
      location_id: 'loc_library',
      additional_info: 'Serial number ends with 8829. Contains CS thesis notes on desktop.',
      contact_phone: '+1 (555) 019-7411',
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      status: 'Possible Match',
    },
    {
      id: 'lost_02',
      item_reference: 'LOST-2026-0002',
      reporter_id: 'usr_marcus',
      category_id: 'cat_wallets',
      item_name: 'Fossil Brown Leather Bi-fold Wallet',
      description: 'Brown leather wallet lost during evening workout at the sports bleachers. Contains student ID and transit pass.',
      color: 'Brown',
      date_lost: '2026-08-24',
      approximate_time: '18:15',
      location_id: 'loc_sports',
      additional_info: 'Has Marcus Johnson student card inside and small copper coin.',
      contact_phone: '+1 (555) 019-8832',
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
      status: 'Possible Match',
    },
    {
      id: 'lost_03',
      item_reference: 'LOST-2026-0003',
      reporter_id: 'usr_alex',
      category_id: 'cat_phones',
      item_name: 'iPhone 14 Pro (Space Gray)',
      description: 'Apple iPhone 14 Pro 128GB in clear shockproof case. Lost during Software Architecture class in Lecture Block A.',
      color: 'Space Gray',
      date_lost: '2026-08-26',
      approximate_time: '10:45',
      location_id: 'loc_block_a',
      additional_info: 'Lock screen wallpaper is Mt. Fuji at sunset. IMEI ending in 4109.',
      contact_phone: '+1 (555) 019-3829',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
      status: 'Lost',
    },
    {
      id: 'lost_04',
      item_reference: 'LOST-2026-0004',
      reporter_id: 'usr_emily',
      category_id: 'cat_student_ids',
      item_name: 'University Student ID Card - Emily Davis',
      description: 'Official campus photo ID card for Health Sciences faculty with blue university lanyard attached.',
      color: 'Blue',
      date_lost: '2026-08-25',
      approximate_time: '12:20',
      location_id: 'loc_cafeteria',
      additional_info: 'Student ID: STU-2024-7744',
      contact_phone: '+1 (555) 019-4190',
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      status: 'Claim Approved',
    },
    {
      id: 'lost_05',
      item_reference: 'LOST-2026-0005',
      reporter_id: 'usr_alex',
      category_id: 'cat_electronics',
      item_name: 'Kingston 64GB DataTraveler USB Drive',
      description: 'Silver metallic Kingston USB 3.0 flash drive with a small red string tied to the keychain hole.',
      color: 'Silver',
      date_lost: '2026-08-20',
      approximate_time: '16:00',
      location_id: 'loc_ict_lab',
      additional_info: 'Contains AI coursework repository and Linux ISO.',
      contact_phone: '+1 (555) 019-3829',
      image_url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80',
      status: 'Returned',
    },
  ];

  for (const item of lostItems) {
    await db.prepare(`
      INSERT INTO lost_items (
        id, item_reference, reporter_id, category_id, item_name, description, color,
        date_lost, approximate_time, location_id, additional_info, contact_phone, image_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'), datetime('now'))
    `).run(
      item.id, item.item_reference, item.reporter_id, item.category_id, item.item_name, item.description,
      item.color, item.date_lost, item.approximate_time, item.location_id, item.additional_info,
      item.contact_phone, item.image_url, item.status
    );
  }

  // 5. SEED FOUND ITEMS
  const foundItems = [
    {
      id: 'found_01',
      item_reference: 'FOUND-2026-0001',
      reporter_id: 'usr_alex',
      category_id: 'cat_laptops',
      item_name: 'HP Pavilion Laptop (Dark Finish)',
      description: 'Found dark gray HP laptop left on a study desk on Level 2 of Main Library near quiet zone.',
      color: 'Black',
      date_found: '2026-08-25',
      approximate_time: '15:10',
      location_id: 'loc_library',
      current_storage_location: 'Central Security Office - Locker B4',
      is_handed_to_security: 1,
      additional_notes: 'Tech stickers on top cover (React logo). Power cable included.',
      is_valuable: 1,
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      status: 'Under Verification',
    },
    {
      id: 'found_02',
      item_reference: 'FOUND-2026-0002',
      reporter_id: 'usr_alex',
      category_id: 'cat_wallets',
      item_name: 'Brown Leather Bi-fold Wallet',
      description: 'Found leather wallet on the lower tier bleachers of the campus sports ground after evening matches.',
      color: 'Brown',
      date_found: '2026-08-24',
      approximate_time: '19:00',
      location_id: 'loc_sports',
      current_storage_location: 'Sports Pavilion Lost & Found Box',
      is_handed_to_security: 1,
      additional_notes: 'Contains student identification card and small cash notes.',
      is_valuable: 1,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
      status: 'Found',
    },
    {
      id: 'found_03',
      item_reference: 'FOUND-2026-0003',
      reporter_id: 'usr_sarah',
      category_id: 'cat_student_ids',
      item_name: 'Campus Student ID Card with Blue Lanyard',
      description: 'Found student ID card on table near salad bar in main university cafeteria.',
      color: 'Blue',
      date_found: '2026-08-25',
      approximate_time: '13:00',
      location_id: 'loc_cafeteria',
      current_storage_location: 'Cafeteria Manager Office / Security Front Desk',
      is_handed_to_security: 1,
      additional_notes: 'Name on card: Emily Davis (Health Sciences).',
      is_valuable: 0,
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      status: 'Claim Approved',
    },
    {
      id: 'found_04',
      item_reference: 'FOUND-2026-0004',
      reporter_id: 'usr_officer',
      category_id: 'cat_keys',
      item_name: 'Toyota Car Key with Navy Blue Lanyard',
      description: 'Found set of vehicle keys with electronic remote fob and gym tag in Parking Zone B.',
      color: 'Black',
      date_found: '2026-08-26',
      approximate_time: '09:00',
      location_id: 'loc_parking',
      current_storage_location: 'Central Security Office - Key Cabinet #12',
      is_handed_to_security: 1,
      additional_notes: 'Has a small silver whistle attached to the ring.',
      is_valuable: 1,
      image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
      status: 'Found',
    },
    {
      id: 'found_05',
      item_reference: 'FOUND-2026-0005',
      reporter_id: 'usr_officer',
      category_id: 'cat_bags',
      item_name: 'North Face Black Commuter Backpack',
      description: 'Found black nylon backpack left in the Student Center lounge 1st floor.',
      color: 'Black',
      date_found: '2026-08-23',
      approximate_time: '17:30',
      location_id: 'loc_student_center',
      current_storage_location: 'Central Security Office - Storage Room A',
      is_handed_to_security: 1,
      additional_notes: 'Contains engineering textbooks and stainless steel tumbler.',
      is_valuable: 0,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      status: 'Found',
    },
    {
      id: 'found_06',
      item_reference: 'FOUND-2026-0006',
      reporter_id: 'usr_officer',
      category_id: 'cat_electronics',
      item_name: 'Kingston 64GB Metal USB Flash Drive',
      description: 'Found plugged into Computer Station #14 in ICT Laboratory.',
      color: 'Silver',
      date_found: '2026-08-20',
      approximate_time: '17:00',
      location_id: 'loc_ict_lab',
      current_storage_location: 'Central Security Office - Archive Bin 3',
      is_handed_to_security: 1,
      additional_notes: 'Red thread tied to loop.',
      is_valuable: 0,
      image_url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80',
      status: 'Returned',
    },
  ];

  for (const item of foundItems) {
    await db.prepare(`
      INSERT INTO found_items (
        id, item_reference, reporter_id, category_id, item_name, description, color,
        date_found, approximate_time, location_id, current_storage_location, is_handed_to_security,
        additional_notes, is_valuable, image_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'), datetime('now'))
    `).run(
      item.id, item.item_reference, item.reporter_id, item.category_id, item.item_name, item.description,
      item.color, item.date_found, item.approximate_time, item.location_id, item.current_storage_location,
      item.is_handed_to_security, item.additional_notes, item.is_valuable, item.image_url, item.status
    );
  }

  // 6. SEED MATCHES
  const matches = [
    {
      id: 'match_01',
      lost_item_id: 'lost_01',
      found_item_id: 'found_01',
      score: 94,
      breakdown: JSON.stringify({ category: 100, location: 100, color: 100, date: 90, description: 80 }),
      reason: 'Matching category (Laptops) • Found in same campus location (Main Library) • Matching color (Black) • Reported within close timeframe',
      status: 'Claimed',
    },
    {
      id: 'match_02',
      lost_item_id: 'lost_02',
      found_item_id: 'found_02',
      score: 92,
      breakdown: JSON.stringify({ category: 100, location: 100, color: 100, date: 90, description: 75 }),
      reason: 'Matching category (Wallets) • Found in same campus location (Sports Ground) • Matching color (Brown)',
      status: 'Suggested',
    },
    {
      id: 'match_03',
      lost_item_id: 'lost_04',
      found_item_id: 'found_03',
      score: 96,
      breakdown: JSON.stringify({ category: 100, location: 100, color: 100, date: 100, description: 85 }),
      reason: 'Matching category (Student IDs) • Found in same campus location (Cafeteria) • Matching color (Blue)',
      status: 'Confirmed',
    },
  ];

  for (const m of matches) {
    await db.prepare(`
      INSERT INTO matches (id, lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'))
    `).run(m.id, m.lost_item_id, m.found_item_id, m.score, m.breakdown, m.reason, m.status);
  }

  // 7. SEED CLAIMS
  const claims = [
    {
      id: 'claim_01',
      claim_reference: 'CLAIM-2026-00451',
      found_item_id: 'found_01',
      lost_item_id: 'lost_01',
      claimant_id: 'usr_sarah',
      ownership_evidence: 'The laptop serial is 5CD8829K91. It has a sticker of the React atom logo and GitHub Octocat on the top shell. The desktop wallpaper is an anime artwork.',
      identifying_marks: 'Small scratch near HDMI port on left edge. Dual-boot Ubuntu/Windows 11.',
      purchase_info: 'Purchased at University Campus Tech Store, August 2024 (Invoice #CS-44910).',
      status: 'Under Review',
      reviewed_by: 'usr_admin',
      reviewed_at: null,
      admin_notes: 'Evidence matches found item sticker description. Ready for final approval.',
    },
    {
      id: 'claim_02',
      claim_reference: 'CLAIM-2026-00452',
      found_item_id: 'found_03',
      lost_item_id: 'lost_04',
      claimant_id: 'usr_emily',
      ownership_evidence: 'My student ID card #STU-2024-7744 with Faculty of Health Sciences emblem and blue university lanyard.',
      identifying_marks: 'Has a small heart sticker on the back plastic card protector.',
      purchase_info: 'Issued by Campus Registrar Office.',
      status: 'Approved',
      reviewed_by: 'usr_admin',
      reviewed_at: '2026-08-26 11:30:00',
      admin_notes: 'Verified identity and student records match perfectly. Collection pass authorized.',
    },
    {
      id: 'claim_03',
      claim_reference: 'CLAIM-2026-00450',
      found_item_id: 'found_06',
      lost_item_id: 'lost_05',
      claimant_id: 'usr_alex',
      ownership_evidence: 'Silver Kingston USB drive with red string loop. Contains folder labeled /CS302_Projects and AlexKim_Resume.pdf.',
      identifying_marks: 'Engraved 64GB DT50 on back casing.',
      purchase_info: 'Bought online Amazon.',
      status: 'Approved',
      reviewed_by: 'usr_officer',
      reviewed_at: '2026-08-21 14:00:00',
      admin_notes: 'Folder contents confirmed by security officer.',
    },
  ];

  for (const c of claims) {
    await db.prepare(`
      INSERT INTO claims (
        id, claim_reference, found_item_id, lost_item_id, claimant_id,
        ownership_evidence, identifying_marks, purchase_info, status,
        admin_notes, reviewed_by, reviewed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'), datetime('now'))
    `).run(
      c.id, c.claim_reference, c.found_item_id, c.lost_item_id, c.claimant_id,
      c.ownership_evidence, c.identifying_marks, c.purchase_info, c.status,
      c.admin_notes, c.reviewed_by, c.reviewed_at
    );
  }

  // 8. SEED HANDOVERS
  const handovers = [
    {
      id: 'hand_01',
      handover_reference: 'HAND-2026-0001',
      claim_id: 'claim_03',
      found_item_id: 'found_06',
      recipient_id: 'usr_alex',
      officer_id: 'usr_officer',
      handover_date: '2026-08-21',
      handover_time: '15:30',
      id_verified: 1,
      status: 'Completed',
      notes: 'Physical student ID verified (Alex Kim - STU-2024-8891). Student verified contents of USB drive on officer terminal before signing.',
      signature_name: 'Alex Kim',
    },
  ];

  for (const h of handovers) {
    await db.prepare(`
      INSERT INTO handovers (
        id, handover_reference, claim_id, found_item_id, recipient_id,
        officer_id, handover_date, handover_time, id_verified, status, notes, signature_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-6 days'))
    `).run(
      h.id, h.handover_reference, h.claim_id, h.found_item_id, h.recipient_id,
      h.officer_id, h.handover_date, h.handover_time, h.id_verified, h.status, h.notes, h.signature_name
    );
  }

  // 9. SEED NOTIFICATIONS
  const notifications = [
    {
      id: 'notif_01',
      user_id: 'usr_sarah',
      title: 'Possible Match Found (94%)',
      message: 'A found HP Pavilion Laptop at Main Library matches your lost report #LOST-2026-0001.',
      notification_type: 'match',
      link: '/items/found/found_01',
      is_read: 0,
    },
    {
      id: 'notif_02',
      user_id: 'usr_emily',
      title: 'Claim Approved — Ready for Collection',
      message: 'Your claim #CLAIM-2026-00452 for "Student ID Card" has been approved! Please visit the security desk with reference #CLAIM-2026-00452.',
      notification_type: 'claim_status',
      link: '/dashboard/claims',
      is_read: 0,
    },
    {
      id: 'notif_03',
      user_id: 'usr_marcus',
      title: 'Possible Match Detected (92%)',
      message: 'A found Brown Leather Bi-fold Wallet at Sports Ground matches your lost report #LOST-2026-0002.',
      notification_type: 'match',
      link: '/items/found/found_02',
      is_read: 1,
    },
    {
      id: 'notif_04',
      user_id: 'usr_alex',
      title: 'Item Successfully Recovered!',
      message: 'Your item "Kingston 64GB Metal USB Flash Drive" has been officially handed over to you (Handover Ref: #HAND-2026-0001).',
      notification_type: 'handover',
      link: '/dashboard/claims',
      is_read: 1,
    },
  ];

  for (const n of notifications) {
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'))
    `).run(n.id, n.user_id, n.title, n.message, n.notification_type, n.link, n.is_read);
  }

  // 10. SEED AUDIT LOGS
  const auditLogs = [
    {
      id: 'audit_01',
      user_id: 'usr_sarah',
      user_name: 'Sarah Chen',
      action: 'REPORT_LOST',
      entity_type: 'lost_item',
      entity_id: 'lost_01',
      description: 'Reported lost item #LOST-2026-0001: HP Pavilion 15 Laptop',
    },
    {
      id: 'audit_02',
      user_id: 'usr_alex',
      user_name: 'Alex Kim',
      action: 'REPORT_FOUND',
      entity_type: 'found_item',
      entity_id: 'found_01',
      description: 'Reported found item #FOUND-2026-0001: HP Pavilion Laptop at Main Library',
    },
    {
      id: 'audit_03',
      user_id: 'usr_sarah',
      user_name: 'Sarah Chen',
      action: 'SUBMIT_CLAIM',
      entity_type: 'claim',
      entity_id: 'claim_01',
      description: 'Submitted ownership claim #CLAIM-2026-00451 for item #FOUND-2026-0001',
    },
    {
      id: 'audit_04',
      user_id: 'usr_admin',
      user_name: 'Dr. Michael Sterling',
      action: 'CLAIM_APPROVED',
      entity_type: 'claim',
      entity_id: 'claim_02',
      description: 'Approved claim #CLAIM-2026-00452 for Student ID Card (Emily Davis)',
    },
    {
      id: 'audit_05',
      user_id: 'usr_officer',
      user_name: 'Officer Raymond Vance',
      action: 'ITEM_HANDOVER',
      entity_type: 'handover',
      entity_id: 'hand_01',
      description: 'Handover #HAND-2026-0001 completed for Kingston USB drive to Alex Kim',
    },
  ];

  for (const a of auditLogs) {
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))
    `).run(a.id, a.user_id, a.user_name, a.action, a.entity_type, a.entity_id, a.description);
  }

  console.log('✅ Supabase PostgreSQL Database seeded successfully with realistic campus dataset!');
}

// If run directly via tsx server/seed.ts
if (process.argv[1]?.includes('seed')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
