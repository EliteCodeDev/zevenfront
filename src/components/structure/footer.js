import { FooterNav } from '../structure/links';


const FooterInfo = () => {
    return (
        <div className="mt-10 text-sm text-zinc-500">
            <div className="flex flex-col">
                <div className="font-bold text-md mb-4 border-b pb-1 border-gray-300 dark:border-zinc-600">
                    {FooterNav.map((item, index) => (
                        <span key={index}>
                            <a href={item.href} target="_blank" className="text-zinc-600 hover:underline dark:text-white">
                                {item.name}
                            </a>
                            {index < FooterNav.length - 1 && <span> &nbsp; | &nbsp; </span>}
                        </span>
                    ))}
                </div>
                <p className="mb-4 max-w-full text-xs text-justify">
                    All the information provided on this site is intended exclusively for educational purposes 
                    related to trading in financial markets and in no way serves as specific investment advice, 
                    business recommendation, analysis of investment opportunities, or a similar general recommendation 
                    regarding the trading of investment instruments. {process.env.NEXT_PUBLIC_NAME_APP} only offers 
                    simulated trading services and educational tools for traders. The information contained on this 
                    site is not directed at residents in any country or jurisdiction where such distribution or use 
                    would violate local laws or regulations. {process.env.NEXT_PUBLIC_NAME_APP} companies do not act 
                    as brokers and do not accept deposits. The technical solution provided for the platforms and the 
                    data feed of {process.env.NEXT_PUBLIC_NAME_APP} is managed by liquidity providers.
                </p>
                <p className="text-xs">
                    2025 © Copyright - {process.env.NEXT_PUBLIC_NAME_APP} Made with ❤ by trading.
                    Version: 1.1.0
                </p>
            </div>
        </div>
    );
};

export default FooterInfo;
