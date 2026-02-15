
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Gizlilik Politikası | Learnaxia",
    description: "Learnaxia gizlilik politikası ve veri güvenliği.",
}

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 prose dark:prose-invert">
            <h1>Gizlilik Politikası</h1>
            <p className="lead">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

            <h2>1. Veri Toplama</h2>
            <p>
                Learnaxia olarak gizliliğinize önem veriyoruz. Bu politika, platformumuzu kullanırken topladığımız bilgileri açıklar.
                Hizmetlerimizi sağlamak için aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul>
                <li><strong>Hesap Bilgileri:</strong> Ad, e-posta adresi, profil resmi.</li>
                <li><strong>Öğrenme Verileri:</strong> Oluşturduğunuz modüller, çalışma istatistikleri, ilerleme durumunu.</li>
                <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri.</li>
            </ul>

            <h2>2. Verilerin Kullanımı</h2>
            <p>Topladığımız verileri şu amaçlarla kullanırız:</p>
            <ul>
                <li>Hizmeti sağlamak ve kişiselleştirmek (örneğin, size özel tekrar planı oluşturmak).</li>
                <li>Hizmet kalitesini artırmak ve analiz etmek.</li>
                <li>Yasal yükümlülükleri yerine getirmek.</li>
            </ul>

            <h2>3. Veri Güvenliği</h2>
            <p>
                Verileriniz endüstri standardı güvenlik önlemleriyle korunmaktadır. Parolalarınız hashlenerek saklanır ve asla açık metin olarak tutulmaz.
            </p>

            <h2>4. İletişim</h2>
            <p>
                Gizlilik politikamızla ilgili sorularınız için <a href="mailto:support@learnaxia.com">support@learnaxia.com</a> adresinden bize ulaşabilirsiniz.
            </p>
        </div>
    )
}
