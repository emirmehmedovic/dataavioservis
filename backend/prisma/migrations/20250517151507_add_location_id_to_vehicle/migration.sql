-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "broj_crijeva_hd38" TEXT,
ADD COLUMN     "broj_crijeva_hd63" TEXT,
ADD COLUMN     "broj_crijeva_tw75" TEXT,
ADD COLUMN     "datum_isteka_cwd" TIMESTAMP(3),
ADD COLUMN     "datum_kalibracije_hidrometra" TIMESTAMP(3),
ADD COLUMN     "datum_kalibracije_moment_kljuca" TIMESTAMP(3),
ADD COLUMN     "datum_kalibracije_termometra" TIMESTAMP(3),
ADD COLUMN     "datum_kalibracije_uredjaja_elektricne_provodljivosti" TIMESTAMP(3),
ADD COLUMN     "datum_testiranja_pritiska_crijeva_hd38" TIMESTAMP(3),
ADD COLUMN     "datum_testiranja_pritiska_crijeva_hd63" TIMESTAMP(3),
ADD COLUMN     "datum_testiranja_pritiska_crijeva_tw75" TIMESTAMP(3),
ADD COLUMN     "filter_annual_inspection_date" TIMESTAMP(3),
ADD COLUMN     "filter_ew_sensor_inspection_date" TIMESTAMP(3),
ADD COLUMN     "filter_next_annual_inspection_date" TIMESTAMP(3),
ADD COLUMN     "filter_vessel_number" TEXT,
ADD COLUMN     "godina_proizvodnje_crijeva_hd38" INTEGER,
ADD COLUMN     "godina_proizvodnje_crijeva_hd63" INTEGER,
ADD COLUMN     "godina_proizvodnje_crijeva_tw75" INTEGER;
