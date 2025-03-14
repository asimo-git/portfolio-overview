"use client";
import { addAssetAsync } from "@/app/redux/portfolioSlice";
import { AppDispatch, RootState } from "@/app/redux/store";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../Modal/Modal";
import styles from "./AssetsTable.module.css";

export default function AssetsTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const assets = useSelector((state: RootState) => state.portfolio.assets);
  const dispatch = useDispatch<AppDispatch>();

  const handleAddAsset = (newAsset: { name: string; quantity: number }) => {
    dispatch(addAssetAsync(newAsset));
    setIsModalOpen(false);
  };

  return (
    <>
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
          {assets.map((asset, index) => (
            <div key={index} className={styles.row}>
              <div>{asset.name}</div>
              <div>{asset.quantity}</div>
              <div>${asset.price.toLocaleString()}</div>
              <div>${asset.cost.toLocaleString()}</div>
              <div
                className={asset.change > 0 ? styles.positive : styles.negative}
              >
                {asset.change > 0
                  ? `+${asset.change.toFixed(2)}%`
                  : `${asset.change.toFixed(2)}%`}
              </div>
              <div>{asset.portfolioShare.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
