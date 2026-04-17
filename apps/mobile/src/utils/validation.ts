import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'กรุณากรอกอีเมลหรือชื่อผู้ใช้')
    .min(3, 'ต้องมีอย่างน้อย 3 ตัวอักษร'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'กรุณากรอกอีเมล')
      .email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z
      .string()
      .min(1, 'กรุณากรอกรหัสผ่าน')
      .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;