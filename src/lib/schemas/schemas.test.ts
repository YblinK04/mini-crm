import { describe, it, expect } from 'vitest';
import { CreateProjectSchema } from '../schemas'; 

describe('Валидация проекта', () => {
  it('должна успешно проходить с корректными данными', () => {
    const validProject = { 
      name: 'Мой проект', 
      color: '#3b82f6',
      description: 'Тестовое описание', 
      isPublic: false 
    };
    
    const result = CreateProjectSchema.safeParse(validProject);
    
    if (!result.success) {
      console.log(result.error.format());
    }

    expect(result.success).toBe(true);
  });

  it('должна возвращать ошибку, если название проекта слишком короткое', () => {
    const invalidProject = { 
      name: '', 
      color: '#3b82f6',
      isPublic: false 
    };
    const result = CreateProjectSchema.safeParse(invalidProject);
    expect(result.success).toBe(false);
  });
});