# NEXE Operasyon

Instagram reklamlarından gelen FSP/denklik bilgilendirme taleplerini, görüşme durumlarını ve komisyon ödemelerini takip etmek için hazırlanmış Google Sheets bağlantılı müşteri takip uygulaması.

## Google Sheet Kolonları

İlk satır başlıkları şu sırayla olmalı:

```text
İSİM | MESLEK | TELEFON | GELİŞ TARİHİ | SON GÖRÜŞME | DURUM | KOMİSYON | ÖDEME | MÜŞTERİ OLMA TARİHİ | NOTLAR
```

Önerilen sayfa adı:

```text
NEXE Operasyon
```

## Kullanılan Alanlar

- `İSİM`: Adayın adı soyadı.
- `MESLEK`: Tıp Doktoru, Diş Hekimi veya Eczacı.
- `TELEFON`: WhatsApp ve arama butonları bu alanı kullanır. Mümkünse ülke koduyla girin.
- `GELİŞ TARİHİ`: Lead'in geldiği tarih.
- `SON GÖRÜŞME`: Uygulama not eklenince otomatik günceller.
- `DURUM`: Adayın süreç durumu.
- `KOMİSYON`: Elle girilir. Örnek: `275 €`, `550 €`.
- `ÖDEME`: Bekliyor, Ödendi veya İptal.
- `MÜŞTERİ OLMA TARİHİ`: Komisyon dönem takibi için.
- `NOTLAR`: Görüşme geçmişi.

## Vercel Ortam Değişkenleri

```text
SHEET_ID=1zx1oJD_IeWXIoDFaVYuLJeBxg5mo_lSkPwcFVzEe-xY
SHEET_NAME=NEXE Operasyon
GOOGLE_SERVICE_ACCOUNT_JSON
```

`SHEET_NAME` boş bırakılırsa uygulama `NEXE Operasyon` sayfasını arar.

## Google Sheet Paylaşımı

Google Sheet şu servis hesabıyla `Düzenleyici` olarak paylaşılmalı:

```text
nexe-sheets@nexe-crm.iam.gserviceaccount.com
```

`GOOGLE_SERVICE_ACCOUNT_JSON` içindeki özel anahtar repo dosyalarına eklenmemeli; sadece Vercel Environment Variable olarak saklanmalı.

## Yayına Alma Notları

Önerilen GitHub repo adı:

```text
nexe-operasyon
```

Vercel proje adı:

```text
nexe-operasyon
```

Vercel'de proje oluşturulduktan sonra `Settings -> Environment Variables` alanına şu değişkenler eklenmeli:

```text
SHEET_ID=1zx1oJD_IeWXIoDFaVYuLJeBxg5mo_lSkPwcFVzEe-xY
SHEET_NAME=NEXE Operasyon
GOOGLE_SERVICE_ACCOUNT_JSON=<service-account-json>
```
