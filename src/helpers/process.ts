export const runMain = async (main: (argv: any[]) => void) => {
    const argv = process.argv.slice(2);
    main(argv).then(console.log).catch(console.error);
};
