'use client';

import React from 'react';
import { Vehicle } from '@/types';
import { 
  FaBalanceScale, 
  FaCalendarAlt,
  FaFlask,
  FaWrench,
  FaThermometerHalf,
  FaTint,
  FaBolt,
  FaExchangeAlt,
  FaChartLine
} from 'react-icons/fa';
import Card from './Card';
import DatePairItem from './DatePairItem';

interface CalibrationSectionProps {
  vehicle: Vehicle;
  onUpdate: () => void;
}

const CalibrationSection: React.FC<CalibrationSectionProps> = ({ vehicle, onUpdate }) => {
  return (
    <Card title="Kalibracije i testovi" icon={<FaBalanceScale />} className="mb-6">
      <div className="mb-6">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">
          Osnovne kalibracije
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePairItem 
            baseLabel="Kalibracija volumetra" 
            lastDate={vehicle.last_volumeter_calibration_date} 
            nextDate={vehicle.next_volumeter_calibration_date} 
            vehicleId={vehicle.id} 
            lastDateFieldName="last_volumeter_calibration_date" 
            nextDateFieldName="next_volumeter_calibration_date" 
            onUpdate={onUpdate} 
            icon={<FaCalendarAlt />} 
          />
          <DatePairItem 
            baseLabel="Kalibracija manometra" 
            lastDate={vehicle.last_manometer_calibration_date} 
            nextDate={vehicle.next_manometer_calibration_date} 
            vehicleId={vehicle.id} 
            lastDateFieldName="last_manometer_calibration_date" 
            nextDateFieldName="next_manometer_calibration_date" 
            onUpdate={onUpdate} 
            icon={<FaCalendarAlt />} 
          />
          <DatePairItem 
            baseLabel="Test sigurnosti od požara" 
            lastDate={vehicle.tanker_last_fire_safety_test_date} 
            nextDate={vehicle.tanker_next_fire_safety_test_date} 
            vehicleId={vehicle.id} 
            lastDateFieldName="tanker_last_fire_safety_test_date" 
            nextDateFieldName="tanker_next_fire_safety_test_date" 
            onUpdate={onUpdate} 
            icon={<FaCalendarAlt />} 
          />
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">
          Testovi i kalibracije opreme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePairItem 
            baseLabel="Hemijski test na vodu" 
            lastDate={vehicle.water_chemical_test_date} 
            nextDate={vehicle.water_chemical_test_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="water_chemical_test_date" 
            nextDateFieldName="water_chemical_test_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaFlask />} 
          />
          <DatePairItem 
            baseLabel="Moment ključ" 
            lastDate={vehicle.torque_wrench_calibration_date} 
            nextDate={vehicle.torque_wrench_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="torque_wrench_calibration_date" 
            nextDateFieldName="torque_wrench_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaWrench />} 
          />
          <DatePairItem 
            baseLabel="Termometar" 
            lastDate={vehicle.thermometer_calibration_date} 
            nextDate={vehicle.thermometer_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="thermometer_calibration_date" 
            nextDateFieldName="thermometer_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaThermometerHalf />} 
          />
          <DatePairItem 
            baseLabel="Hidrometar" 
            lastDate={vehicle.hydrometer_calibration_date} 
            nextDate={vehicle.hydrometer_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="hydrometer_calibration_date" 
            nextDateFieldName="hydrometer_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaTint />} 
          />
          <DatePairItem 
            baseLabel="Mjerač električne provodljivosti" 
            lastDate={vehicle.conductivity_meter_calibration_date} 
            nextDate={vehicle.conductivity_meter_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="conductivity_meter_calibration_date" 
            nextDateFieldName="conductivity_meter_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaBolt />} 
          />
          <DatePairItem 
            baseLabel="Mjerač otpora" 
            lastDate={vehicle.resistance_meter_calibration_date} 
            nextDate={vehicle.resistance_meter_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="resistance_meter_calibration_date" 
            nextDateFieldName="resistance_meter_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaExchangeAlt />} 
          />
          <DatePairItem 
            baseLabel="Glavni mjerač protoka" 
            lastDate={vehicle.main_flow_meter_calibration_date} 
            nextDate={vehicle.main_flow_meter_calibration_valid_until} 
            vehicleId={vehicle.id} 
            lastDateFieldName="main_flow_meter_calibration_date" 
            nextDateFieldName="main_flow_meter_calibration_valid_until" 
            onUpdate={onUpdate} 
            icon={<FaChartLine />} 
          />
        </div>
      </div>
    </Card>
  );
};

export default CalibrationSection;
