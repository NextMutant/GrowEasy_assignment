import { parseCsv } from '../src/csv/csvParser';

describe('CSV Parser', () => {
  it('should parse standard CSV correctly', () => {
    const csv = 'Name,Email,Age\nJohn,john@example.com,30\nJane,jane@example.com,25';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Name: 'John', Email: 'john@example.com', Age: '30' });
    expect(result[1]).toEqual({ Name: 'Jane', Email: 'jane@example.com', Age: '25' });
  });

  it('should strip UTF-8 BOM', () => {
    const csv = '\uFEFFName,Email\nJohn,john@example.com';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Name: 'John', Email: 'john@example.com' });
  });

  it('should handle duplicate headers by auto-suffixing', () => {
    const csv = 'Email,Email,Email\na@b.com,c@d.com,e@f.com';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Email: 'a@b.com',
      Email_1: 'c@d.com',
      Email_2: 'e@f.com',
    });
  });

  it('should handle empty/blank lines greedily', () => {
    const csv = '\nName,Email\n\nJohn,john@example.com\n\n\nJane,jane@example.com\n   ,   \n';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Name: 'John', Email: 'john@example.com' });
    expect(result[1]).toEqual({ Name: 'Jane', Email: 'jane@example.com' });
  });

  it('should handle quoted values and embedded commas', () => {
    const csv = 'Name,Quote,Description\nJohn,"Be yourself, everyone else is taken",Nice guy\n"Smith, Jane",Hello,"Smart, funny"';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      Name: 'John',
      Quote: 'Be yourself, everyone else is taken',
      Description: 'Nice guy',
    });
    expect(result[1]).toEqual({
      Name: 'Smith, Jane',
      Quote: 'Hello',
      Description: 'Smart, funny',
    });
  });

  it('should escape raw line breaks in cell values as \\n', () => {
    const csv = 'Name,Remarks\nJohn,"First line\nSecond line\r\nThird line"\nJane,Simple';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(2);
    expect(result[0].Remarks).toBe('First line\\nSecond line\\nThird line');
    expect(result[1].Remarks).toBe('Simple');
  });

  it('should auto-name empty headers', () => {
    const csv = 'Name,,Email\nJohn,some_val,john@example.com';
    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCsv(buffer);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Name: 'John',
      Column: 'some_val',
      Email: 'john@example.com',
    });
  });
});
