import { Redirect } from 'expo-router';

// Ana giriş noktası - kullanıcıyı login sayfasına yönlendir
export default function Index() {
    return <Redirect href="/login" />;
}
