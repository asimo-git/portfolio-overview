"use client";
import { useState } from "react";
import Modal from "./conponents/Modal/Modal";
import styles from "./page.module.css";

type Asset = {
  name: string;
  quantity: number;
  price: number;
  change: number;
  portfolioShare: number;
};

const assets: Asset[] = [];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddAsset = (asset: { name: string; quantity: number }) => {
    console.log(asset);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Список активов</h1>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className={styles.addButton}
          >
            Добавить актив
          </button>

          {isModalOpen && (
            <Modal
              onClose={() => {
                setIsModalOpen(false);
              }}
              onAdd={handleAddAsset}
            />
          )}

          {assets.length === 0 ? (
            <div>Список активов пуст</div>
          ) : (
            <div className={styles.table}>
              <div className={styles.header}>
                <div>Название</div>
                <div>Количество</div>
                <div>Текущая цена</div>
                <div>Общая стоимость</div>
                <div>Изменение за 24 часа</div>
                <div>Доля в портфеле</div>
              </div>
              {assets.map((asset) => (
                <div key={asset.name} className={styles.row}>
                  <div>{asset.name}</div>
                  <div>{asset.quantity}</div>
                  <div>${asset.price.toLocaleString()}</div>
                  <div>${(asset.quantity * asset.price).toLocaleString()}</div>
                  <div
                    className={
                      asset.change > 0 ? styles.positive : styles.negative
                    }
                  >
                    {asset.change > 0
                      ? `+${asset.change.toFixed(2)}%`
                      : `${asset.change.toFixed(2)}%`}
                  </div>
                  <div>{asset.portfolioShare}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
