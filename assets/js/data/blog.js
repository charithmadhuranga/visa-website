/* Lanka Global Access — Blog data
 * Each post: id, title, category, date, readTime, author, excerpt, content (HTML string).
 * NOTE: dates are indicative sample content.
 */

const LGA_BLOG_POSTS = [
    {
        id: 'student-visa-interview-questions',
        title: 'Student Visa Interview: 10 Questions You Must Be Ready For',
        category: 'Visas',
        date: '2026-07-18',
        readTime: '6 min',
        author: 'LGA Counselling Team',
        excerpt: 'Consular officers decide in minutes. Here are the ten questions that decide most student visa interviews — and how to answer them convincingly.',
        content: `
            <p>The interview stage intimidates many applicants, but it shouldn't. Officers ask a small set of predictable questions designed to test one thing: <strong>are you a genuine student?</strong> Prepare honest, specific answers to these ten and you'll walk in calm.</p>
            <h3>1. Why this university?</h3>
            <p>Name concrete reasons: course structure, faculty research, facilities, rankings — never "my agent chose it".</p>
            <h3>2. Why this course? How does it connect to your past studies?</h3>
            <p>Show a logical academic thread from your A/Ls or degree into the program you've chosen.</p>
            <h3>3. Why this country and not another?</h3>
            <p>Compare on education quality, industry exposure or research strengths — not just lifestyle.</p>
            <h3>4. Who is funding your education?</h3>
            <p>Be precise: who pays, what they earn, what documents back it up. Vague answers here sink files.</p>
            <h3>5. What will you do after graduating?</h3>
            <p>Emphasise how the qualification strengthens your career plan at home — even if you may apply for work visas later, your stated intent must be genuine study.</p>
            <h3>6. Tell me about your accommodation plans</h3>
            <p>Know the city, typical rents, and whether you'll take university housing initially.</p>
            <h3>7. What do you know about the city where you'll live?</h3>
            <p>A little research signals seriousness — transport, weather, student communities.</p>
            <h3>8. Do you have relatives abroad?</h3>
            <p>Answer truthfully. Inconsistencies discovered later are far worse than an honest "yes" now.</p>
            <h3>9. What will you do during breaks?</h3>
            <p>Mention travel or short courses — but anchor your answer to returning home for family and career.</p>
            <h3>10. Any final points?</h3>
            <p>Use this to summarise your preparation in two confident sentences.</p>
            <p><strong>LGA runs free mock interviews for every client we lodge.</strong> Practise these answers aloud until they sound natural — not memorised.</p>`
    },
    {
        id: 'ielts-vs-pte-guide',
        title: 'IELTS vs PTE: Which English Test Should You Actually Take?',
        category: 'English Tests',
        date: '2026-06-30',
        readTime: '5 min',
        author: 'LGA Training Unit',
        excerpt: 'Both tests are widely accepted — but scoring style, turnaround time and your personal strengths make one clearly smarter for you. Here\'s how to choose.',
        content: `
            <p>Nearly every study destination accepts both IELTS and PTE Academic today. So the question isn't acceptance — it's fit.</p>
            <h3>Choose PTE when…</h3>
            <ul>
                <li>You need results fast (typically 48 hours).</li>
                <li>You're comfortable speaking to a computer — AI scoring removes examiner nerves.</li>
                <li>You prefer integrated tasks that combine skills (one task can score listening + writing).</li>
                <li>Your destination is Australia or New Zealand, where every university accepts it.</li>
            </ul>
            <h3>Choose IELTS when…</h3>
            <ul>
                <li>You're targeting the UK (some routes still expect IELTS for UKVI).</li>
                <li>You write well but freeze in front of screens — paper format exists.</li>
                <li>You want a human examiner for speaking who can follow natural conversation.</li>
                <li>Your programme lists band requirements per skill (IELTS makes these explicit).</li>
            </ul>
            <h3>The score conversion cheat sheet</h3>
            <p>Roughly: IELTS 6.0 ≈ PTE 50–57 · IELTS 6.5 ≈ PTE 58–64 · IELTS 7.0 ≈ PTE 65–78. Universities publish exact tables — we match them during counselling so you register for the right exam the first time.</p>
            <p>Our advice after coaching hundreds of students: <strong>take a diagnostic of each with us before booking either.</strong> The test that matches your instincts will always produce the better result.</p>`
    },
    {
        id: 'sop-that-wins-admissions',
        title: 'How to Write a Statement of Purpose That Wins Admissions',
        category: 'Applications',
        date: '2026-06-12',
        readTime: '7 min',
        author: 'LGA Counselling Team',
        excerpt: 'Your SOP is the only place admissions officers hear your voice. This structure has produced offers from Toronto to Melbourne for our students.',
        content: `
            <p>After reviewing many applications, we can predict which SOPs succeed within the first paragraph. They follow a story logic, not a template feel.</p>
            <h3>The five-part structure</h3>
            <ol>
                <li><strong>The spark (10%)</strong> — a specific moment that started your interest. One vivid sentence beats three generic ones.</li>
                <li><strong>The foundation (25%)</strong> — academic background and projects that prove capability. Quantify everything.</li>
                <li><strong>The bridge (25%)</strong> — why THIS program fills a precise gap. Name modules, labs, professors.</li>
                <li><strong>The proof beyond class (20%)</strong> — internships, volunteering, leadership that show initiative.</li>
                <li><strong>The return (20%)</strong> — clear post-study goals connected to home-country demand. Visa officers read this section too.</li>
            </ol>
            <h3>Three mistakes that guarantee rejection</h3>
            <ul>
                <li>Copying templates found online — plagiarism detectors flag them instantly.</li>
                <li>Listing achievements without linking them to the course.</li>
                <li>Vague endings like "contribute to society". Name the industry, role and reason.</li>
            </ul>
            <p>Every LGA application includes two rounds of SOP editing by counsellors who know what each university's committee looks for. Bring us your draft — or your blank page.</p>`
    },
    {
        id: 'canada-gic-explained',
        title: 'Canada GIC Explained: Proof of Funds Without the Stress',
        category: 'Finances',
        date: '2026-05-22',
        modified: '2026-11-19',
        readTime: '5 min',
        author: 'LGA Counselling Team',
        excerpt: 'Learn what a Canadian Guaranteed Investment Certificate is, how it may support a study permit application, and what to confirm with IRCC and your bank.',
        content: `
            <p>A <strong>GIC (Guaranteed Investment Certificate)</strong> is a bank investment product that may be used as part of the financial evidence for a Canadian study permit application. It does not guarantee approval, and the financial documents required depend on the current rules and your circumstances. The Student Direct Stream (SDS) ended in November 2024; check current application instructions before relying on any older SDS checklist.</p>
            <h3>What it actually is</h3>
            <p>A GIC is an investment held with a financial institution under its product terms. The required amount, eligible issuers, account activation process and payout schedule can vary. Do not rely on a fixed amount or payout description without checking directly with the bank and the current government instructions.</p>
            <h3>How it may support your application</h3>
            <ul>
                <li>The issuer provides documentation about the investment and funds.</li>
                <li>It can be considered alongside tuition, living costs, travel and other financial evidence.</li>
                <li>Immigration officers assess the complete application; a GIC does not ensure a faster decision or visa approval.</li>
            </ul>
            <h3>What to check before arranging one</h3>
            <ol>
                <li>Read the current IRCC proof-of-financial-support requirements and any local visa office instructions.</li>
                <li>Confirm that the financial institution accepts applicants in your situation and review its current terms.</li>
                <li>Check the amount, transfer method, documents, account activation steps and payout schedule directly with the issuer.</li>
                <li>Keep the issuer's confirmation and include it with the other evidence requested for your application.</li>
            </ol>
            <p>A GIC is only one possible part of your financial evidence. Requirements and amounts can change, so confirm them on the <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html" target="_blank" rel="noopener noreferrer">official IRCC proof of financial support page</a> and with your financial institution before applying.</p>`
    },
    {
        id: 'post-study-work-rights-compared',
        title: 'Post-Study Work Options: Australia, Canada, UK, NZ & USA',
        category: 'Destinations',
        date: '2026-04-15',
        modified: '2026-11-19',
        readTime: '8 min',
        author: 'LGA Research Desk',
        excerpt: 'Compare post-study work options in Australia, Canada, the UK, New Zealand and the USA, with links to current official eligibility rules.',
        content: `
            <p>Post-study work options can be one factor when comparing destinations, but eligibility and duration depend on your course, qualification, circumstances and application date. These routes do not guarantee employment, permanent residence or another visa. Rules change, so use the official sources linked below before making plans.</p>
            <h3>Australia — Temporary Graduate (subclass 485)</h3>
            <p>The Temporary Graduate visa has different streams. Eligibility and stay period depend on factors including your qualification and the stream you apply under. Check the current <a href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-graduate-485" target="_blank" rel="noopener noreferrer">Australian Department of Home Affairs subclass 485 guidance</a>.</p>
            <h3>Canada — PGWP</h3>
            <p>A Post-Graduation Work Permit is available only to eligible graduates and programs; a school's DLI status alone does not establish program eligibility. Permit duration depends on the program and other requirements. Review the current <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html" target="_blank" rel="noopener noreferrer">IRCC PGWP guidance</a>.</p>
            <h3>United Kingdom — Graduate Route</h3>
            <p>Under current GOV.UK rules, the Graduate visa lasts 2 years for applications made on or before 31 December 2026, and 18 months for applications made on or after 1 January 2027. Doctoral graduates can get 3 years. See the latest <a href="https://www.gov.uk/graduate-visa" target="_blank" rel="noopener noreferrer">UK Graduate visa eligibility and duration rules</a>.</p>
            <h3>New Zealand — Post-Study Work Visa</h3>
            <p>Eligible graduates may be able to stay and work for up to 3 years, depending on qualification level and study duration. Conditions differ by qualification and can restrict the work you do. Check Immigration New Zealand's <a href="https://www.immigration.govt.nz/visas/post-study-work-visa/" target="_blank" rel="noopener noreferrer">Post-Study Work Visa guidance</a>.</p>
            <h3>USA — OPT &amp; STEM OPT</h3>
            <p>Eligible F-1 students may apply for up to 12 months of Optional Practical Training related to their major; some qualifying STEM graduates may apply for a 24-month extension subject to additional requirements. See <a href="https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students" target="_blank" rel="noopener noreferrer">USCIS OPT guidance</a>.</p>
            <h3>How to choose</h3>
            <p>Compare the course and institution, total costs, work-route eligibility and your longer-term plans. Confirm requirements with the relevant government authority and university before committing; only immigration authorities decide visa applications.</p>`
    }
];

function lgaPostById(id) {
    return LGA_BLOG_POSTS.find(p => p.id === id);
}

function lgaFormatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return iso; }
}
