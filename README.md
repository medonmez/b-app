# BUSAS App

> **UYARI:** Bu proje geliştirme aşamasındadır ve henüz tamamlanmamıştır. Şu anda aktif olarak geliştirilmekte olup, fonksiyonlar ve arayüzde değişiklikler olabilir.

BUSAS App, Firebase tabanlı bir dalış kulübü yönetim uygulamasıdır. Kullanıcılar kayıt olabilir, duyuruları görebilir, dalış planlarına ve eğitimlere katılabilir. Admin paneli ile kullanıcı ve içerik yönetimi yapılabilir.

## Özellikler

- Firebase Authentication ile kullanıcı girişi ve kaydı
- Admin paneli: kullanıcı, duyuru ve dalış planı yönetimi
- Duyuru ve yorum sistemi
- Dalış planı oluşturma ve katılımcı yönetimi
- Eğitim materyalleri ve ders programı
- Responsive arayüz (HTML, CSS, JS)

## Kurulum

1. Depoyu klonlayın:
   ```sh
   git clone https://github.com/<kullanici-adiniz>/b-app.git
   cd b-app
   ```

2. Gerekli bağımlılıkları yükleyin:
   ```sh
   npm install
   ```

3. Firebase projenizi oluşturun ve `public/script.js` içindeki `firebaseConfig` alanını kendi bilgilerinizle güncelleyin.

4. Geliştirme için:
   - `public/index.html` dosyasını bir tarayıcıda açabilirsiniz.
   - Firebase Hosting kullanıyorsanız:
     ```sh
     firebase serve
     ```

## Kullanılan Teknolojiler

- [Firebase (Auth, Firestore, Hosting)](https://firebase.google.com/)
- HTML5, CSS3, Vanilla JavaScript

## Katkı

Pull request’ler ve öneriler açıktır. Lütfen önce bir issue açın.

## Lisans

MIT