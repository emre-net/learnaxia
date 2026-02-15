
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Kullanım Şartları | Learnaxia",
    description: "Learnaxia kullanım koşulları ve hizmet sözleşmesi.",
}

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 prose dark:prose-invert">
            <h1>Kullanım Şartları</h1>
            <p className="lead">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

            <h2>1. Kabul</h2>
            <p>
                Learnaxia'yı kullanarak bu şartları kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız lütfen hizmeti kullanmayınız.
            </p>

            <h2>2. Hizmetin Tanımı</h2>
            <p>
                Learnaxia, yapay zeka destekli bir öğrenme ve çalışma platformudur. Platform, kullanıcıların flashcard, quiz ve çalışma planları oluşturmasına olanak tanır.
            </p>

            <h2>3. Kullanıcı Sorumlulukları</h2>
            <ul>
                <li>Hesap güvenliğinizden siz sorumlusunuz.</li>
                <li>Platformu yasa dışı amaçlarla kullanamazsınız.</li>
                <li>Başkalarının telif haklarını ihlal eden içerik paylaşamazsınız.</li>
            </ul>

            <h2>4. Fikri Mülkiyet</h2>
            <p>
                Learnaxia'nın tüm hakları saklıdır. Platform üzerindeki kod, tasarım ve marka unsurları Learnaxia'ya aittir.
                Sizin oluşturduğunuz içeriklerin (özetler, notlar) mülkiyeti size aittir, ancak platforma bu içerikleri işlemek için lisans vermiş olursunuz.
            </p>

            <h2>5. Değişiklikler</h2>
            <p>
                Learnaxia bu şartları dilediği zaman değiştirme hakkını saklı tutar. Değişiklikler yayınlandığı andan itibaren geçerli olur.
            </p>

            <h2>6. İletişim</h2>
            <p>
                Sorularınız için <a href="mailto:support@learnaxia.com">support@learnaxia.com</a> ile iletişime geçebilirsiniz.
            </p>
        </div>
    )
}
