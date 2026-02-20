import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    ArrowRight,
    Globe,
    Building2,
    HardHat,
    Hammer,
    Ruler,
    Truck,
    DraftingCompass,
    Wrench,
    Users,
    Trophy,
    Briefcase,
    CheckCircle
} from 'lucide-react';
import Logo from '../assets/images/Logo.png';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Theme Constants
    const PRIMARY_COLOR = 'bg-[#155dff]';
    const PRIMARY_TEXT = 'text-[#155dff]';
    const PRIMARY_HOVER = 'hover:bg-[#114bcc]';
    const PRIMARY_BORDER = 'border-[#155dff]';

    const [pricingPlans, setPricingPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('https://construction-backend-production-b192.up.railway.app/api/plans');
                const data = await response.json();
                if (data && data.length > 0) {
                    const formattedPlans = data.map(plan => ({
                        id: plan._id,
                        name: plan.name,
                        price: plan.price,
                        period: plan.period === 'custom' ? '' : `/${plan.period}`,
                        features: plan.features,
                        highlight: plan.isPopular
                    }));
                    setPricingPlans(formattedPlans);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            }
        };

        fetchPlans();
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-orange-500 selection:text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={Logo} alt="KAAL Constructions" className="h-16 w-auto" style={{width: "135px", height: "135px"}} />
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-10">
                            {['Home', 'Services', 'Pricing', 'Company', 'Projects'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-slate-600 hover:text-[#155dff] font-medium transition-colors duration-200 text-sm uppercase tracking-wide"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-600 hover:text-[#155dff] font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/register?type=quote')}
                                className={`${PRIMARY_COLOR} ${PRIMARY_HOVER} text-white px-6 py-2.5 rounded shadow-md hover:shadow-lg transition-all duration-300 font-medium`}
                            >
                                Get a Quote
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-slate-600 hover:text-slate-900 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {['Home', 'Services', 'Pricing', 'Company', 'Projects'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="block px-3 py-3 text-base font-bold text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="pt-4 flex flex-col space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full text-center px-4 py-3 border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate('/register?type=quote')}
                                    className={`w-full ${PRIMARY_COLOR} text-white px-4 py-3 rounded-lg font-medium shadow-md`}
                                >
                                    Get a Quote
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="pt-20 lg:pt-0 min-h-screen flex items-center bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                        <div className="bg-slate-50 h-full order-2 lg:order-1"></div>
                        <div className="h-full relative order-1 lg:order-2">
                            <img
                                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop"
                                alt="Construction Site"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply"></div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20 lg:py-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="lg:pr-12">
                            <span className={`${PRIMARY_TEXT} font-semibold tracking-wider text-sm uppercase mb-4 block`}>
                                Explore The Features
                            </span>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-8">
                                This is an award-winning construction company.
                            </h1>
                            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg">
                                This is an award-winning construction company with a team of skilled craftsmen and women who have over 100 years of combined experience.
                            </p>
                            <div className="flex flex-wrap gap-6 items-center">
                                <button
                                    onClick={() => navigate('/register?type=quote')}
                                    className={`${PRIMARY_COLOR} ${PRIMARY_HOVER} text-white px-8 py-4 rounded font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[160px]`}
                                >
                                    Get a Quote
                                </button>
                                <button
                                    onClick={() => document.getElementById('company').scrollIntoView({ behavior: 'smooth' })}
                                    className={`${PRIMARY_TEXT} font-semibold hover:text-blue-700 transition-colors flex items-center gap-2`}
                                >
                                    Read More <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About / Stats Section */}
            <section id="company" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                            <img
                                src="https://images.unsplash.com/photo-1503708928676-1cb796a0891e?q=80&w=1974&auto=format&fit=crop"
                                alt="Construction Excavator"
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div>
                            <span className={`${PRIMARY_TEXT} font-bold text-sm uppercase tracking-wider mb-2 block`}>
                                About Us
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                We Deliver Unique Construction Solutions
                            </h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                We have built our reputation as true local area experts. We have gained more knowledge about buyer interests, our neighborhood and the market than any other brand because we live locally and work for local people.
                            </p>
                            <p className="text-slate-600 mb-10 leading-relaxed">
                                Our commitment to quality and innovation has made us a trusted partner for residential and commercial projects alike. We bring your vision to life with precision and care.
                            </p>
                            <button
                                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
                                className={`${PRIMARY_COLOR} ${PRIMARY_HOVER} text-white px-8 py-3.5 rounded font-medium shadow-md transition-colors`}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-100 pt-16">
                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:shadow-md transition-shadow">
                            <span className={`text-4xl font-bold ${PRIMARY_TEXT} mb-2`}>32+</span>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <Trophy className="w-5 h-5 text-slate-400" />
                                <span className="font-medium">years</span>
                            </div>
                            <span className="text-slate-500 text-sm">experience</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:shadow-md transition-shadow">
                            <span className={`text-4xl font-bold ${PRIMARY_TEXT} mb-2`}>379+</span>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <Briefcase className="w-5 h-5 text-slate-400" />
                                <span className="font-medium">projects</span>
                            </div>
                            <span className="text-slate-500 text-sm">completed</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:shadow-md transition-shadow">
                            <span className={`text-4xl font-bold ${PRIMARY_TEXT} mb-2`}>84+</span>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <DraftingCompass className="w-5 h-5 text-slate-400" />
                                <span className="font-medium">qualified</span>
                            </div>
                            <span className="text-slate-500 text-sm">engineers</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:shadow-md transition-shadow">
                            <span className={`text-4xl font-bold ${PRIMARY_TEXT} mb-2`}>100+</span>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <HardHat className="w-5 h-5 text-slate-400" />
                                <span className="font-medium">qualified</span>
                            </div>
                            <span className="text-slate-500 text-sm">workers</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            We build everything you need, choose an individual approach
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        {/* Service Item 1 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <Building2 className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">New Construction</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>

                        {/* Service Item 2 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <HardHat className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">Reconstructions</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>

                        {/* Service Item 3 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <Hammer className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">Restorations</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>

                        {/* Service Item 4 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <Ruler className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">Capital Repair</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>

                        {/* Service Item 5 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <Truck className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">Re-equipment</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>

                        {/* Service Item 6 */}
                        <div className="flex gap-6 group cursor-pointer">
                            <div className="flex-shrink-0">
                                <DraftingCompass className={`w-12 h-12 ${PRIMARY_TEXT} transition-transform group-hover:scale-110 duration-300`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#155dff] transition-colors">Individual Planning</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    What is construction and which construction works are related to works that require obtaining permits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dark CTA Section */}
            <section className="bg-slate-900 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center">
                        <div className="relative h-[600px] hidden lg:block overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                                alt="Modern Building"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="py-12 lg:py-0">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                                A family business for the last 50 years
                            </h2>
                            <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
                            </p>
                            <p className="text-slate-400 mb-12 leading-relaxed text-lg">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.
                            </p>
                            <button
                                onClick={() => document.getElementById('company').scrollIntoView({ behavior: 'smooth' })}
                                className={`${PRIMARY_COLOR} ${PRIMARY_HOVER} text-white px-10 py-4 rounded font-bold text-lg shadow-lg hover:shadow-blue-900/50 transition-all duration-300`}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className={`${PRIMARY_TEXT} font-bold text-sm uppercase tracking-wider mb-2 block`}>
                            Plans & Pricing
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Choose your plan</h2>
                        <p className="text-xl text-slate-600">Choose the plan that's right for your business.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative rounded-2xl p-8 transition-all duration-300 ${plan.highlight
                                    ? 'bg-slate-900 text-white shadow-2xl scale-105 border-0'
                                    : 'bg-white text-slate-900 border border-slate-200 hover:shadow-xl hover:-translate-y-1'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className={`absolute top-0 right-0 -mr-2 -mt-2 ${PRIMARY_COLOR} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg`}>
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline mb-6">
                                    <span className="text-4xl font-extrabold">${plan.price}</span>
                                    <span className={`text-sm ml-2 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.highlight ? 'text-[#155dff]' : 'text-green-500'}`} />
                                            <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => navigate(`/register?plan=${plan.name.toLowerCase()}`)}
                                    className={`w-full py-3 rounded-xl font-bold transition-colors ${plan.highlight
                                        ? 'bg-[#155dff] hover:bg-blue-600 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                        }`}
                                >
                                    Choose Plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                                <img src={Logo} alt="KAAL Constructions" className="h-12 w-auto brightness-0 invert" />
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Building the future with precision and passion. Your trusted partner in construction excellence.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-slate-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Projects</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Resources</h4>
                            <ul className="space-y-4 text-slate-400 text-sm">
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Our Team</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Contact</h4>
                            <ul className="space-y-4 text-slate-400 text-sm">
                                <li className="flex items-start gap-3">
                                    <span>123 Construction Blvd,<br />Building City, ST 12345</span>
                                </li>
                                <li><a href="tel:+11234567890" className="hover:text-white transition-colors">+1 (123) 456-7890</a></li>
                                <li><a href="mailto:info@constructos.com" className="hover:text-white transition-colors">info@constructos.com</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                        <p>&copy; {new Date().getFullYear()} KAAL Constructions. All rights reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
