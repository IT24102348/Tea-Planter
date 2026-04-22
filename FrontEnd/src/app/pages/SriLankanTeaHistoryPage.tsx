import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

const JAMES_TAYLOR_IMAGE =
  '/james-taylor.jpg';
const TEA_HISTORY_REFERENCE = 'https://teasrilanka.org/history';
const CEYLON_TEA_MUSEUM_REFERENCE = 'https://www.ceylonteamuseum.com/';
const TEA_WAGONS_IMAGE =
  '/img_19.jpg';
const OLD_FACTORY_IMAGE =
  '/img_20.jpg';
const HISTORY_WORK_IMAGE = '/img_21.jpg';

const timeline = [
  '1824: A tea plant from China was brought to Ceylon and planted at Peradeniya (non-commercial).',
  '1839: Establishment of the Ceylon Chamber of Commerce.',
  '1854: Planters\' Association of Ceylon was established.',
  '1867: James Taylor began tea planting at Loolecondera Estate in Kandy.',
  '1872: First sale of Loolecondera tea in Kandy.',
  '1873: First Sri Lanka tea consignment (23 lbs) was exported from Loolecondera to London.',
  '1877: First "Sirocco" tea drier was manufactured by Samuel C. Davidson.',
  '1880: First tea rolling machine was manufactured by John Walker and Co.',
  '1883: First public Colombo tea auction was held.',
  '1884: Central tea factory was constructed at Fairyland Estate (Pedro), Nuwara Eliya.',
  '1892: James Taylor died in Ceylon on 2 May, aged 57.',
  '1925: Tea Research Institute was established.',
  '1927: Tea production and exports both exceeded 100,000 metric tons.',
  '1932: Ceylon Tea Propaganda Board was formed and poor-quality exports were prohibited.',
  '1941: First Ceylonese tea broking house (M/s Pieris and Abeywardena) was established.',
  '1965: Sri Lanka became the world\'s largest tea exporter for the first time.',
  '1966: First International Tea Convention celebrated 100 years of the tea industry.',
  '1972: State takeover of privately owned estates.',
  '1976: Sri Lanka Tea Board was established.',
  '1983: Centennial year of the Colombo Tea Auctions.',
  '1993: Management of government-owned tea estates was privatized.',
  '2001: Tea Museum at Kandy was established.',
  '2002: Tea Association of Sri Lanka was formed.',
  '2000s onward: Sri Lanka remained a major global origin for premium Ceylon tea.',
];

export function SriLankanTeaHistoryPage() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#D7E4DC] font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto bg-[#E8F0E9] rounded-[2.5rem] md:rounded-[4rem] min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-2xl border border-white/40 flex flex-col">
        <PublicNavbar />

        <div className="relative pt-40 pb-20 px-6 md:px-12 lg:px-20 flex-grow">
          <article className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider mb-8">
              <BookOpen className="w-4 h-4 text-[#C8FF4C]" />
              Education
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Sri Lankan Tea History
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mb-12">
              Sri Lanka became a global tea landmark in the late 19th century. After coffee crops
              were devastated by disease, tea cultivation rapidly transformed the island economy and
              shaped the identity of Ceylon tea around the world.
            </p>

            <div className="bg-white/70 border border-white/60 rounded-[2rem] p-8 shadow-sm mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">From Coffee to Ceylon Tea</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                During British rule, coffee was initially the major plantation crop. In the 1870s,
                coffee rust (Hemileia vastatrix) devastated estates. Planters tested alternatives
                such as cocoa and cinchona, but widespread challenges pushed a large transition to tea.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By the late 19th century, tea manufacturing technology, tea auctions, estate
                conversion, and export networks turned Ceylon tea into a global brand associated with
                premium quality.
              </p>
            </div>

            <section className="bg-white/70 border border-white/60 rounded-[2rem] p-8 shadow-sm mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">James Taylor: Tea Innovator</h2>
              {!imageFailed ? (
                <figure className="mb-6">
                  <img
                    src={JAMES_TAYLOR_IMAGE}
                    alt="James Taylor, pioneer of Sri Lankan tea"
                    className="w-full object-cover max-h-[460px] rounded-2xl border border-gray-100"
                    onError={() => setImageFailed(true)}
                  />
                  <figcaption className="mt-2 text-sm font-semibold text-gray-900">
                    James Taylor, pioneer of Ceylon tea cultivation.
                  </figcaption>
                </figure>
              ) : (
                <p className="mb-6 text-gray-600">
                  Portrait unavailable right now. James Taylor is remembered as a key pioneer of Sri
                  Lankan tea innovation.
                </p>
              )}
              <p className="text-gray-700 leading-relaxed mb-4">
                James Taylor (1835-1892), born in Scotland, arrived in Ceylon in 1852 as a 17-year-old
                and was posted to Loolecondera Estate near Kandy. At that time, hill country
                plantations were still largely focused on coffee.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                After coffee plantations were devastated by fungus, Taylor began commercial tea
                planting on 19 acres at Loolecondera in 1867 using Assam-origin seed. He developed his
                early manufacture process manually in a bungalow verandah with hand rolling, clay
                stoves, and charcoal fires, improving through trial, reading, and guidance from
                experienced planters.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The first shipment of Ceylon tea - 23 pounds in two small packs - was sent to London
                tea auction, and his 1873 teas reportedly achieved strong prices. Over four decades in
                Sri Lanka, his work helped establish tea as the island's defining plantation economy,
                earning him recognition as the "Father of Ceylon Tea Industry."
              </p>
              <p className="text-gray-700 leading-relaxed">
                Taylor never married and is often described as having devoted his life to tea. He died
                in Sri Lanka on 2 May 1892 and was buried at Mahaiyawa Cemetery, Kandy. Today,
                equipment linked to his work is preserved in the James Taylor section at Ceylon Tea
                Museum.
              </p>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 md:p-10 shadow-sm mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">History Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <img
                  src={JAMES_TAYLOR_IMAGE}
                  alt="James Taylor portrait"
                  className="w-full h-28 md:h-32 object-cover rounded-xl border border-gray-100"
                />
                <img
                  src={TEA_WAGONS_IMAGE}
                  alt="Historic tea wagons in Ceylon"
                  className="w-full h-28 md:h-32 object-cover rounded-xl border border-gray-100"
                />
                <img
                  src={OLD_FACTORY_IMAGE}
                  alt="Old tea factory in Sri Lanka"
                  className="w-full h-28 md:h-32 object-cover rounded-xl border border-gray-100"
                />
                <img
                  src={HISTORY_WORK_IMAGE}
                  alt="Historic tea work in Ceylon"
                  className="w-full h-28 md:h-32 object-cover rounded-xl border border-gray-100"
                />
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 md:p-10 shadow-sm mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Historical Timeline</h2>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                {timeline.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <div className="bg-white/70 border border-white/60 rounded-[2rem] p-8 shadow-sm mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Institutions, Auctions, and Global Reach</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Key institutions strengthened the industry over time, including the Planters
                Association, Colombo tea auction structures, tea brokers, and the Tea Research
                Institute. Quality controls and export regulation helped protect the international
                reputation of Ceylon tea.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Sri Lanka supplied tea at global events and expanded into new tea categories,
                including instant, green, and CTC teas. Even after the country name changed from
                Ceylon to Sri Lanka in 1972, the "Ceylon Tea" label remained in use as a major global
                quality brand.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This continuity helped preserve international trust and market recognition while the
                industry modernized through privatization and ongoing innovation.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">References</h2>
              <p className="text-gray-700 mb-3">
                Primary historical details on this page are adapted from the Tea Exporters Association
                Sri Lanka history publication.
              </p>
              <div className="space-y-2">
                <a
                  href={TEA_HISTORY_REFERENCE}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-black underline underline-offset-4 hover:text-gray-700 transition-colors break-all"
                >
                  {TEA_HISTORY_REFERENCE}
                </a>
                <a
                  href={CEYLON_TEA_MUSEUM_REFERENCE}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-black underline underline-offset-4 hover:text-gray-700 transition-colors break-all"
                >
                  {CEYLON_TEA_MUSEUM_REFERENCE}
                </a>
              </div>
            </div>

          </article>
        </div>

        <div className="mt-auto">
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
