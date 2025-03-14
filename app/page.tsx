import AssetsTable from "./conponents/AssetsTable/AssetsTable";
import styles from "./page.module.css";
import ReduxProvider from "./redux/ReduxProvider";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Список активов</h1>
          <ReduxProvider>
            <AssetsTable />
          </ReduxProvider>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
