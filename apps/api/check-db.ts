import postgres from 'postgres';

// ดึงค่า URL จาก Environment Variable (แก้ชื่อตัวแปรให้ตรงกับใน .env ของคุณ)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: ไม่พบ DATABASE_URL ในไฟล์ .env');
  process.exit(1);
}

console.log('⏳ กำลังตรวจสอบการเชื่อมต่อฐานข้อมูล...');

// กำหนด timeout สั้นๆ (เช่น 5 วินาที) จะได้ไม่ต้องรอนานถ้ามันค้าง
const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });

async function checkConnection() {
  try {
    // ลองยิงคำสั่ง SQL เปล่าๆ เพื่อเทสการเชื่อมต่อ
    await sql`SELECT 1`;
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');
    process.exit(0); // ออกจากสคริปต์แบบ Success
  } catch (error: any) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้!\n');
    console.error('รายละเอียด Error:');
    console.error(error.message || error);
    
    console.error('\n🛠️ วิธีแก้ไขเบื้องต้น:');
    console.error('1. ตรวจสอบ DATABASE_URL ในไฟล์ .env ว่าถูกต้องหรือไม่');
    console.error('2. หากใช้ Local (Docker): เช็คว่า Container รันอยู่หรือไม่ (ลองพิมพ์ docker ps)');
    console.error('3. หากใช้ Cloud (Neon, Supabase): ฐานข้อมูลอาจจะ Sleep อยู่ หรือ IP ของคุณไม่ได้อยู่ใน Whitelist');
    console.error('4. หากต่อผ่าน Wi-Fi มหาวิทยาลัยหรือออฟฟิศ: อาจมีการบล็อกพอร์ตฐานข้อมูล (ปกติพอร์ต 5432)');
    
    process.exit(1); // ออกจากสคริปต์แบบ Error เพื่อหยุดการทำงานของ drizzle-kit
  } finally {
    await sql.end();
  }
}

checkConnection();