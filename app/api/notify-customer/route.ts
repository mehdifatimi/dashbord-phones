import { NextResponse } from 'next/server';

// Configuration Twilio (À ajouter dans le fichier .env.local)
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone et le message sont requis.' },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json(
        { error: 'La configuration Twilio est manquante sur le serveur (.env.local).' },
        { status: 500 }
      );
    }

    // Appel à l'API Twilio (via fetch pour éviter d'installer le package twilio si non nécessaire, ou utilisez le sdk npm twilio)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Format the phone number. Twilio requires E.164 formatting (ex: +212612345678)
    const formattedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;

    const params = new URLSearchParams();
    params.append('To', formattedPhone);
    params.append('From', twilioPhone);
    params.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'envoi du SMS via Twilio');
    }

    return NextResponse.json({ success: true, messageId: data.sid });
  } catch (error: any) {
    console.error('Twilio Error:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de l\'envoi du message.' },
      { status: 500 }
    );
  }
}
