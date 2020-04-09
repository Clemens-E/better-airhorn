import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Statistic extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    event: string;

    @Column()
    value: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;


    constructor(values?: { event: string; value: number }) {
        super();
        if (values) {
            this.event = values.event;
            this.value = values.value;
        }
    }

}

@Entity()
export class Usage extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @Column()
    command: string;

    @Column()
    user: string;

    @Column()
    guild: string;

    @Column({ nullable: true })
    args: string;

    constructor(values?: { command: string; user: string; guild: string; args: string }) {
        super();
        if (values) {
            this.command = values.command;
            this.user = values.user;
            this.guild = values.guild;
            this.args = values.args;
        }
    }

}
