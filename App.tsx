import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Role = 'cust' | 'vend' | 'edit';
type Vendor = { id: string; name: string; phone: string; status: 'pending' | 'approved' | 'blocked' };
type QuoteRequest = { id: number; category: string; details: string; budget: string; quote: string; customerPhone: string; vendorPhone: string };

const categories = ['🚗 Car', '🏍️ Bike', '⚡ Electrical', '🍲 Food & Catering', '🏠 Property', '📱 Mobiles & Electronics', '🛋️ Furniture', '🎉 Events', '✈️ Travel', '🧱 Construction', '📦 Others'];
const copy = {
  en: { title: 'PR App', subtitle: 'Smart Quotations', login: 'Choose a role to continue', customer: 'Customer', vendor: 'Vendor', editor: 'Editor', phone: 'Mobile number (10 digits)', pin: 'Editor password', loginBtn: 'Continue', logout: 'Log out', register: 'Register as a vendor', business: 'Business name', request: 'Request a quotation', category: 'Category', details: 'Requirement details (model, brand, quantity)', budget: 'Expected budget (₹)', submit: 'Submit request', requests: 'Quotation requests', price: 'Quote price (₹)', quote: 'Send quote', approval: 'Your vendor account is awaiting admin approval.', blocked: 'Your vendor account is blocked. Contact the administrator.', vendors: 'Vendor management', revenue: 'Revenue', settings: 'Settings', approve: 'Approve', block: 'Block', save: 'Save', refresh: 'Refresh' },
  kn: { title: 'PR App', subtitle: 'ಸ್ಮಾರ್ಟ್ ಕೊಟೇಶನ್', login: 'ಮುಂದುವರಿಸಲು ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ', customer: 'ಗ್ರಾಹಕ', vendor: 'ವ್ಯಾಪಾರಿ', editor: 'ಎಡಿಟರ್', phone: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕಿ)', pin: 'ಎಡಿಟರ್ ಪಾಸ್‌ವರ್ಡ್', loginBtn: 'ಮುಂದುವರಿಸಿ', logout: 'ಲಾಗ್ ಔಟ್', register: 'ವ್ಯಾಪಾರಿಯಾಗಿ ನೋಂದಣಿ', business: 'ವ್ಯಾಪಾರದ ಹೆಸರು', request: 'ಕೊಟೇಶನ್ ಕೇಳಿ', category: 'ವಿಭಾಗ', details: 'ಅಗತ್ಯದ ವಿವರ (ಮಾಡೆಲ್, ಬ್ರ್ಯಾಂಡ್, ಪ್ರಮಾಣ)', budget: 'ಅಂದಾಜು ಬಜೆಟ್ (₹)', submit: 'ವಿನಂತಿ ಕಳುಹಿಸಿ', requests: 'ಕೊಟೇಶನ್ ವಿನಂತಿಗಳು', price: 'ಬೆಲೆ (₹)', quote: 'ಕೊಟೇಶನ್ ಕಳುಹಿಸಿ', approval: 'ನಿಮ್ಮ ವ್ಯಾಪಾರಿ ಖಾತೆ ಅನುಮೋದನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ.', blocked: 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.', vendors: 'ವ್ಯಾಪಾರಿ ನಿರ್ವಹಣೆ', revenue: 'ಆದಾಯ', settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್', approve: 'ಅನುಮೋದಿಸಿ', block: 'ನಿರ್ಬಂಧಿಸಿ', save: 'ಉಳಿಸಿ', refresh: 'ರಿಫ್ರೆಶ್' },
};

export default function App() {
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const t = copy[language];
  const [role, setRole] = useState<Role>('cust');
  const [loggedIn, setLoggedIn] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [business, setBusiness] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<'vendors' | 'revenue' | 'settings'>('vendors');
  const [editorPin, setEditorPin] = useState('');
  const vendorRecord = vendors.find((vendor) => vendor.phone === phone);
  const [fee, setFee] = useState('49');
  const [regFee, setRegFee] = useState('499');
  const [savedFees, setSavedFees] = useState({ quote: '49', registration: '499' });
  const [transactions, setTransactions] = useState<{ id: string; description: string; amount: number }[]>([]);
  const totalRevenue = useMemo(() => transactions.reduce((sum, item) => sum + item.amount, 0), [transactions]);

  const continueLogin = () => {
    if (role === 'edit') {
      if (pin.length < 8 || pin !== editorPin) {
        Alert.alert('PR App', 'Editor authentication is not configured. Connect a secure server-side admin login before production use.');
        return;
      }
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('PR App', 'Enter a valid 10-digit mobile number.');
      return;
    } else if (role === 'vend' && !vendors.some((vendor) => vendor.phone === phone)) {
      Alert.alert('PR App', 'This number is not registered as a vendor. Register first.');
      return;
    }
    setLoggedIn(true);
  };

  const registerVendor = () => {
    if (!business.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('PR App', 'Enter a business name and valid 10-digit mobile number.');
      return;
    }
    if (vendors.some((vendor) => vendor.phone === phone)) {
      Alert.alert('PR App', 'This mobile number is already registered.');
      return;
    }
    setVendors((current) => [{ id: `${Date.now()}`, name: business.trim(), phone, status: 'pending' }, ...current]);
    setRegistering(false);
    setBusiness('');
    Alert.alert('PR App', 'Registration saved as pending. Payment is not configured or collected in this prototype.');
  };

  const createRequest = () => {
    if (!details.trim()) return Alert.alert('PR App', 'Enter the requirement details first.');
    setRequests((current) => [{ id: Date.now(), category, details: details.trim(), budget, quote: '', customerPhone: phone, vendorPhone: '' }, ...current]);
    setDetails('');
    setBudget('');
    Alert.alert('PR App', 'Quotation request saved. No payment has been collected.');
  };

  const sendQuote = (id: number) => {
    const amount = prices[id]?.trim();
    if (!amount || !Number.isFinite(Number(amount))) return Alert.alert('PR App', 'Enter a valid quote price.');
    Alert.alert('Payment not configured', `The ₹${savedFees.quote} quotation fee cannot be charged yet. Connect a verified payment gateway before enabling quote submission.`);
  };

  const updateVendor = (id: string, status: Vendor['status']) => setVendors((current) => current.map((vendor) => vendor.id === id ? { ...vendor, status } : vendor));

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}><Text style={styles.logoText}>PR</Text></View>
          <Text style={styles.brand}>{t.title}</Text><Text style={styles.muted}>{t.subtitle}</Text>
          <TouchableOpacity style={styles.language} onPress={() => setLanguage(language === 'en' ? 'kn' : 'en')}><Text>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</Text></TouchableOpacity>
          <View style={styles.card}>
            <Text style={styles.heading}>{registering ? t.register : t.login}</Text>
            {!registering && <View style={styles.row}>{(['cust', 'vend', 'edit'] as Role[]).map((item) => <TouchableOpacity key={item} onPress={() => setRole(item)} style={[styles.role, role === item && styles.roleSelected]}><Text style={role === item ? styles.white : styles.text}>{item === 'cust' ? t.customer : item === 'vend' ? t.vendor : t.editor}</Text></TouchableOpacity>)}</View>}
            {registering && <TextInput style={styles.input} placeholder={t.business} value={business} onChangeText={setBusiness} />}
            <TextInput style={styles.input} placeholder={t.phone} keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />
            {role === 'edit' && !registering && <TextInput style={styles.input} placeholder={t.pin} secureTextEntry value={pin} onChangeText={setPin} />}
            <TouchableOpacity style={styles.button} onPress={registering ? registerVendor : continueLogin}><Text style={styles.white}>{registering ? t.register : t.loginBtn}</Text></TouchableOpacity>
            {role === 'vend' && <TouchableOpacity onPress={() => setRegistering(!registering)}><Text style={styles.link}>{registering ? '← Back to vendor login' : t.register}</Text></TouchableOpacity>}
            <Text style={styles.disclaimer}>Prototype only: authentication, payments, and shared data storage require secure backend configuration.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.brand}>{t.title}</Text><Text style={styles.muted}>{role === 'cust' ? t.customer : role === 'vend' ? t.vendor : t.editor}</Text></View><TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'kn' : 'en')}><Text style={styles.link}>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</Text></TouchableOpacity></View>
        {role === 'edit' ? <>
          <View style={styles.tabs}>{(['vendors', 'revenue', 'settings'] as const).map((item) => <TouchableOpacity key={item} style={[styles.tab, tab === item && styles.tabActive]} onPress={() => setTab(item)}><Text style={tab === item ? styles.white : styles.text}>{item === 'vendors' ? t.vendors : item === 'revenue' ? t.revenue : t.settings}</Text></TouchableOpacity>)}</View>
          {tab === 'vendors' && <View style={styles.card}><Text style={styles.heading}>{t.vendors}</Text>{vendors.length === 0 && <Text style={styles.muted}>No vendors registered yet.</Text>}{vendors.map((item) => <View key={item.id} style={styles.listItem}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.muted}>{item.phone} · {item.status}</Text><View style={styles.row}>{item.status !== 'approved' && <TouchableOpacity style={styles.smallButton} onPress={() => updateVendor(item.id, 'approved')}><Text style={styles.white}>{t.approve}</Text></TouchableOpacity>}{item.status !== 'blocked' && <TouchableOpacity style={[styles.smallButton, styles.danger]} onPress={() => updateVendor(item.id, 'blocked')}><Text style={styles.white}>{t.block}</Text></TouchableOpacity>}</View></View>)}</View>}
          {tab === 'revenue' && <View style={styles.card}><Text style={styles.heading}>{t.revenue}</Text><Text style={styles.amount}>₹{totalRevenue}</Text><Text style={styles.muted}>No real payments are enabled. Revenue shown only reflects verified backend records (currently none).</Text></View>}
          {tab === 'settings' && <View style={styles.card}><Text style={styles.heading}>{t.settings}</Text><TextInput style={styles.input} keyboardType="numeric" value={fee} onChangeText={setFee} placeholder="Quotation fee (₹)"/><TextInput style={styles.input} keyboardType="numeric" value={regFee} onChangeText={setRegFee} placeholder="Vendor registration fee (₹)"/><TouchableOpacity style={styles.button} onPress={() => { setSavedFees({ quote: fee, registration: regFee }); Alert.alert('PR App', 'Prototype settings saved for this session only.'); }}><Text style={styles.white}>{t.save}</Text></TouchableOpacity><Text style={styles.disclaimer}>Settings are not persisted or protected by server-side admin authentication.</Text></View>}
        </> : <>
          {role === 'vend' && <View style={[styles.card, vendorRecord?.status === 'blocked' ? styles.blocked : styles.pending]}><Text>{vendorRecord?.status === 'blocked' ? t.blocked : vendorRecord?.status === 'pending' ? t.approval : vendorRecord?.status === 'approved' ? 'Vendor approved.' : 'Vendor profile not found.'}</Text></View>}
          {role === 'cust' && <View style={styles.card}><Text style={styles.heading}>{t.request}</Text><Text style={styles.label}>{t.category}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>{categories.map((item) => <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}><Text style={category === item ? styles.white : styles.text}>{item}</Text></TouchableOpacity>)}</ScrollView><TextInput style={[styles.input, styles.multiline]} placeholder={t.details} multiline value={details} onChangeText={setDetails}/><TextInput style={styles.input} placeholder={t.budget} keyboardType="numeric" value={budget} onChangeText={setBudget}/><TouchableOpacity style={styles.button} onPress={createRequest}><Text style={styles.white}>{t.submit}</Text></TouchableOpacity></View>}
          <View style={styles.card}><Text style={styles.heading}>{t.requests}</Text>{requests.length === 0 && <Text style={styles.muted}>No requests yet.</Text>}{requests.map((item) => <View key={item.id} style={styles.listItem}><Text style={styles.label}>{item.category}</Text><Text style={styles.itemTitle}>{item.details}</Text>{item.budget ? <Text style={styles.muted}>Budget: ₹{item.budget}</Text> : null}<Text style={item.quote ? styles.success : styles.muted}>{item.quote ? `Quote: ₹${item.quote}` : 'Awaiting quotation'}</Text>{role === 'vend' && vendorRecord?.status === 'approved' && !item.quote && <><TextInput style={styles.input} placeholder={t.price} keyboardType="numeric" value={prices[item.id] || ''} onChangeText={(value) => setPrices((current) => ({ ...current, [item.id]: value }))}/><TouchableOpacity style={styles.button} onPress={() => sendQuote(item.id)}><Text style={styles.white}>{t.quote}</Text></TouchableOpacity></>}</View>)}</View>
        </>}
        <TouchableOpacity style={styles.outline} onPress={() => { setLoggedIn(false); setRole('cust'); setPhone(''); setPin(''); }}><Text style={styles.text}>{t.logout}</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' }, loginPage: { flexGrow: 1, justifyContent: 'center', padding: 20 }, page: { padding: 16 }, logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#1e3a8a', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2, borderColor: '#f59e0b' }, logoText: { color: '#f59e0b', fontSize: 26, fontWeight: 'bold' }, brand: { color: '#1e3a8a', fontWeight: 'bold', fontSize: 24 }, muted: { color: '#64748b', marginTop: 4 }, loginPageBrand: { textAlign: 'center' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, elevation: 2 }, heading: { color: '#1e3a8a', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }, row: { flexDirection: 'row', gap: 8, marginVertical: 8 }, role: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', padding: 10, borderRadius: 8, alignItems: 'center' }, roleSelected: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }, input: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginVertical: 6 }, multiline: { minHeight: 88, textAlignVertical: 'top' }, button: { backgroundColor: '#1e3a8a', borderRadius: 8, padding: 13, alignItems: 'center', marginVertical: 7 }, smallButton: { backgroundColor: '#059669', borderRadius: 7, padding: 9, flex: 1, alignItems: 'center' }, danger: { backgroundColor: '#dc2626' }, white: { color: '#fff', fontWeight: 'bold' }, text: { color: '#1f2937' }, link: { color: '#2563eb', fontWeight: 'bold', marginTop: 12, textAlign: 'center' }, language: { alignSelf: 'center', padding: 8, marginBottom: 12 }, disclaimer: { color: '#92400e', backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10 }, label: { color: '#374151', fontWeight: 'bold' }, categoryRow: { marginVertical: 10 }, chip: { backgroundColor: '#e5e7eb', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginRight: 7 }, chipActive: { backgroundColor: '#1e3a8a' }, listItem: { borderTopWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12 }, itemTitle: { fontWeight: '600', color: '#1f2937', marginVertical: 5 }, success: { color: '#059669', fontWeight: 'bold', marginTop: 6 }, pending: { backgroundColor: '#fffbeb' }, blocked: { backgroundColor: '#fef2f2' }, tabs: { flexDirection: 'row', backgroundColor: '#e5e7eb', padding: 4, borderRadius: 10, marginBottom: 14 }, tab: { flex: 1, alignItems: 'center', padding: 9, borderRadius: 8 }, tabActive: { backgroundColor: '#1e3a8a' }, amount: { fontSize: 30, color: '#1e3a8a', fontWeight: 'bold' }, outline: { padding: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, alignItems: 'center', marginVertical: 6 },
});
