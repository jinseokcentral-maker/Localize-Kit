import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

const SUPABASE_URL = 'https://example.supabase.co';
const SUPABASE_SECRET_KEY = 'secret-key';

const mockSupabaseClient = {} as unknown as SupabaseClient;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') {
                return SUPABASE_URL;
              }
              if (key === 'SUPABASE_SECRET_KEY') {
                return SUPABASE_SECRET_KEY;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('creates a client and exposes it', () => {
    const client = service.getClient();
    expect(client).toBe(mockSupabaseClient);
  });
});
