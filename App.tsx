
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from './src/supabase';

const FEES = {
  quotation: 49,
  vendorRegistration: 499
};

const categories = [
  'Car', 'Bike', 'Electrical', 'Food & Catering',
  'Property', 'Mobiles & Electronics', 'Furniture',
  'Events & Wedding', 'Travel & Tours',
  'Construction Materials', 'Others'
];

export default function App() {
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [profile, setProfile] = useState<any>(null);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [category, setCategory] = useState('Car');
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');

  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const kn = language === 'kn';

  const t = (english: string, kannada: string) =>
    kn ? kannada : english;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadData();
  }, [session]);

  async function sendOTP() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('PR App', 'Enter a valid 10-digit mobile number');
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: '+91' + phone
    });

    setBusy(false);

    if (error) {
      Alert.alert('Login Error', error.message);
    } else {
      Alert.alert('OTP', 'OTP sent. Please check your mobile.');
    }
  }

  async function verifyOTP() {
    setBusy(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: '+91' + phone,
      token: otp,
      type: 'sms'
    });

    setBusy(false);

    if (error) Alert.alert('Login Error', error.message);
  }

  async function loadData() {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    setProfile(userProfile);

    if (userProfile?.role) setRole(userProfile.role);

    const { data, error } = await supabase
      .from('quotation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setRequests(data || []);
  }

  async function saveProfile() {
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      phone: session.user.phone,
      role,
      business_name: role === 'vendor' ? businessName : null,
      vendor_status: role === 'vendor' ? 'pending' : null
    });

    if (error) {
      Alert.alert('Profile Error', error.message);
    } else {
      Alert.alert('PR App', 'Profile saved successfully');
      loadData();
    }
  }

  async function createQuotationRequest() {
    if (!details.trim()) {
      Alert.alert('PR App', 'Please enter requirement details');
      return;
    }

    // This inserts an unpaid request for development/testing.
    // Production must create and verify the ₹49 payment on the server
    // before marking the request as paid or publishing it to vendors.

    const { error } = await supabase
      .from('quotation_requests')
      .insert({
        customer_id: session.user.id,
        category,
        details,
        budget: budget ? Number(budget) : null,
        status: 'open',
        fee_status: 'unpaid'
      });

    if (error) {
      Alert.alert('Request Error', error.message);
    } else {
      setDetails('');
      setBudget('');
      Alert.alert(
        'PR App',
        'Test request saved. Payment is not collected.'
      );
      loadData();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setRequests([]);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.login}>
          <Text style={styles.logo}>PR APP</Text>
          <Text style={styles.subtitle}>
            {t('Smart Quotations', 'ಸ್ಮಾರ್ಟ್ ಕೊಟೇಶನ್')}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.outline}
              onPress={() => setLanguage('en')}>
              <Text>English</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outline}
              onPress={() => setLanguage('kn')}>
              <Text>ಕನ್ನಡ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heading}>
            {t('Mobile Login', 'ಮೊಬೈಲ್ ಲಾಗಿನ್')}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t('Mobile Number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={sendOTP}
            disabled={busy}>
            <Text style={styles.buttonText}>
              {t('Send OTP', 'OTP ಕಳುಹಿಸಿ')}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={verifyOTP}
            disabled={busy}>
            <Text style={styles.buttonText}>
              {t('Verify & Login', 'ಪರಿಶೀಲಿಸಿ ಲಾಗಿನ್')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoSmall}>PR APP</Text>
          <TouchableOpacity
            onPress={() => setLanguage(kn ? 'en' : 'kn')}>
            <Text style={styles.link}>
              {kn ? 'English' : 'ಕನ್ನಡ'}
            </Text>
          </TouchableOpacity>
        </View>

        {!profile?.role && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {t('Choose Account Type', 'ಖಾತೆಯ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ')}
            </Text>

            <TouchableOpacity
              style={styles.outline}
              onPress={() => setRole('customer')}>
              <Text>Customer / ಗ್ರಾಹಕ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outline}
              onPress={() => setRole('vendor')}>
              <Text>Vendor / ವ್ಯಾಪಾರಿ</Text>
            </TouchableOpacity>

            {role === 'vendor' && (
              <TextInput
                style={styles.input}
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
              />
            )}

            <Text style={styles.note}>
              Vendor Registration Fee: ₹{FEES.vendorRegistration}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={saveProfile}>
              <Text style={styles.buttonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {role === 'customer' && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {t('Request Quotation', 'ಕೊಟೇಶನ್ ಕೇಳಿ')}
            </Text>

            <Text style={styles.note}>
              Quotation Fee: ₹{FEES.quotation}
            </Text>

            <Text style={styles.label}>Select Category</Text>

            {categories.map(item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.category,
                  category === item && styles.selected
                ]}
                onPress={() => setCategory(item)}>
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Requirement details (model, brand, quantity)"
              multiline
              value={details}
              onChangeText={setDetails}
            />

            <TextInput
              style={styles.input}
              placeholder="Expected Budget ₹"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={createQuotationRequest}>
              <Text style={styles.buttonText}>
                Submit Test Request
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {role === 'vendor' && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {t('Vendor Requests', 'ವ್ಯಾಪಾರಿ ವಿನಂತಿಗಳು')}
            </Text>

            <Text style={styles.note}>
              Vendor account requires admin approval before quoting.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.heading}>
            {t('Quotation Requests', 'ಕೊಟೇಶನ್ ವಿನಂತಿಗಳು')}
          </Text>

          {requests.map(item => (
            <View key={item.id} style={styles.request}>
              <Text style={styles.label}>{item.category}</Text>
              <Text>{item.details}</Text>
              <Text style={styles.note}>
                Budget: {item.budget ? '₹' + item.budget : 'Not specified'}
              </Text>
              <Text style={styles.note}>Status: {item.status}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.outline} onPress={loadData}>
          <Text>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outline} onPress={logout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fa' },
  login: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#173b68',
    textAlign: 'center'
  },
  logoSmall: { fontSize: 25, fontWeight: 'bold', color: '#173b68' },
  subtitle: { textAlign: 'center', color: '#64748b', marginBottom: 25 },
  heading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#173b68',
    marginBottom: 12
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginVertical: 7
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#173b68',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  outline: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    margin: 4,
    alignItems: 'center'
  },
  row: { flexDirection: 'row', justifyContent: 'center' },
  link: { color: '#2563eb', fontWeight: 'bold' },
  note: { color: '#64748b', fontSize: 12, marginVertical: 6 },
  label: { fontWeight: 'bold', color: '#173b68' },
  category: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 8,
    marginVertical: 3
  },
  selected: { backgroundColor: '#dceafe', borderColor: '#3972bb' },
  request: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12
  }
});
