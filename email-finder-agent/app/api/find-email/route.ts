import { NextRequest, NextResponse } from 'next/server';

interface EmailPattern {
  pattern: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

const emailPatterns: EmailPattern[] = [
  { pattern: '{first}.{last}@{domain}', description: 'Standard: firstname.lastname', confidence: 'high' },
  { pattern: '{first}{last}@{domain}', description: 'No separator: firstnamelastname', confidence: 'high' },
  { pattern: '{first}_{last}@{domain}', description: 'Underscore: firstname_lastname', confidence: 'medium' },
  { pattern: '{first}-{last}@{domain}', description: 'Hyphen: firstname-lastname', confidence: 'medium' },
  { pattern: '{firstInitial}{last}@{domain}', description: 'First initial + last: flastname', confidence: 'high' },
  { pattern: '{firstInitial}.{last}@{domain}', description: 'First initial dot last: f.lastname', confidence: 'medium' },
  { pattern: '{first}{lastInitial}@{domain}', description: 'First + last initial: firstnamel', confidence: 'low' },
  { pattern: '{first}@{domain}', description: 'First name only', confidence: 'low' },
  { pattern: '{last}@{domain}', description: 'Last name only', confidence: 'low' },
  { pattern: '{last}.{first}@{domain}', description: 'Reversed: lastname.firstname', confidence: 'medium' },
  { pattern: '{last}{first}@{domain}', description: 'Reversed no separator: lastnamefirstname', confidence: 'low' },
  { pattern: '{first}+{last}@{domain}', description: 'Plus sign: firstname+lastname', confidence: 'low' },
];

function generateEmail(pattern: EmailPattern, firstName: string, lastName: string, domain: string): string {
  const firstLower = firstName.toLowerCase();
  const lastLower = lastName.toLowerCase();
  const firstInitial = firstLower.charAt(0);
  const lastInitial = lastLower.charAt(0);

  let email = pattern.pattern
    .replace('{first}', firstLower)
    .replace('{last}', lastLower)
    .replace('{firstInitial}', firstInitial)
    .replace('{lastInitial}', lastInitial)
    .replace('{domain}', domain);

  return email;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, domain } = body;

    if (!firstName || !lastName || !domain) {
      return NextResponse.json(
        { error: 'firstName, lastName, and domain are required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Generate all possible email patterns
    const results = emailPatterns.map(pattern => ({
      email: generateEmail(pattern, firstName, lastName, domain),
      source: pattern.description,
      confidence: pattern.confidence,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error finding emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
